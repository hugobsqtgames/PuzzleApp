import PuzzleKit

/// Règles de déblocage (GAME_DESIGN § 3). On débloque par quantité de lumière,
/// jamais par un puzzle précis.
public struct ProgressionRules: Codable, Hashable, Sendable {
    /// Part d'une salle à éclairer pour ouvrir la suivante (arrondi au supérieur).
    public var roomUnlockPercent = 60
    /// Lanternes du bâtiment précédent nécessaires pour ouvrir le suivant.
    public var previousBuildingLights = 20
    /// Lanternes (hors clé) d'un bâtiment nécessaires pour ouvrir sa lanterne-clé.
    public var keystoneLights = 30

    public init() {}
    public static let standard = ProgressionRules()

    public func lightsToOpenNextRoom(afterRoomOf size: Int) -> Int {
        (size * roomUnlockPercent + 99) / 100
    }
}

/// Lecture seule : que peut faire le joueur, que lui reste-t-il, où aller ensuite ?
public struct Progression: Sendable {
    public let world: World
    public let rules: ProgressionRules

    /// Index précalculés : salle de chaque lanterne, et position de chaque lanterne.
    private let roomIndex: [PuzzleID: Room]
    private let placeIndex: [PuzzleID: (district: Int, building: Int, room: Int?)]

    public init(world: World, rules: ProgressionRules = .standard) {
        self.world = world
        self.rules = rules
        var rooms: [PuzzleID: Room] = [:]
        var places: [PuzzleID: (Int, Int, Int?)] = [:]
        for (di, d) in world.districts.enumerated() {
            for (bi, b) in d.buildings.enumerated() {
                for (ri, r) in b.rooms.enumerated() {
                    for l in r.lanterns { rooms[l.puzzle] = r; places[l.puzzle] = (di, bi, ri) }
                }
                if let key = b.keystone { places[key.puzzle] = (di, bi, nil) }
            }
        }
        roomIndex = rooms
        placeIndex = places
    }

    public func isSolved(_ lantern: Lantern, _ state: GameState) -> Bool { state.solved[lantern.puzzle] != nil }

    public func lights(_ lanterns: [Lantern], _ state: GameState) -> Int { lanterns.filter { isSolved($0, state) }.count }

    /// Lumières totales : une par lanterne du monde allumée.
    public func totalLights(_ state: GameState) -> Int { lights(world.allLanterns, state) }

    /// Lettres de l'Allumeur obtenues.
    public func letters(_ state: GameState) -> Int {
        world.districts.flatMap(\.buildings).filter { b in b.keystoneGivesLetter && b.keystone.map { isSolved($0, state) } == true }.count
    }

    public func isUnlocked(_ district: District, _ state: GameState) -> Bool {
        isUnlocked(district, totalLights: totalLights(state), letters: letters(state))
    }

    func isUnlocked(_ district: District, totalLights: Int, letters: Int) -> Bool {
        switch district.unlock {
        case .always: true
        case .totalLights(let n): totalLights >= n
        case .totalLightsAndLetters(let n, let l): totalLights >= n && letters >= l
        }
    }

    public func isUnlocked(building index: Int, in district: District, _ state: GameState) -> Bool {
        guard isUnlocked(district, state) else { return false }
        if index == 0 { return true }
        return lights(district.buildings[index - 1].allLanterns, state) >= rules.previousBuildingLights
    }

    public func isUnlocked(room index: Int, in building: Building, buildingUnlocked: Bool, _ state: GameState) -> Bool {
        guard buildingUnlocked else { return false }
        if index == 0 { return true }
        let previous = building.rooms[index - 1]
        return lights(previous.lanterns, state) >= rules.lightsToOpenNextRoom(afterRoomOf: previous.lanterns.count)
    }

    public func isKeystoneUnlocked(_ building: Building, buildingUnlocked: Bool, _ state: GameState) -> Bool {
        buildingUnlocked && lights(building.regularLanterns, state) >= min(rules.keystoneLights, building.regularLanterns.count)
    }

    /// Lanternes jouables (ouvertes), dans l'ordre du monde.
    public func playableLanterns(_ state: GameState) -> [Lantern] {
        var result: [Lantern] = []
        let total = totalLights(state), letterCount = letters(state)
        for district in world.districts where isUnlocked(district, totalLights: total, letters: letterCount) {
            for (bi, building) in district.buildings.enumerated() {
                let open = bi == 0 || lights(district.buildings[bi - 1].allLanterns, state) >= rules.previousBuildingLights
                guard open else { continue }
                for (ri, room) in building.rooms.enumerated() where isUnlocked(room: ri, in: building, buildingUnlocked: open, state) {
                    result.append(contentsOf: room.lanterns)
                }
                if let key = building.keystone, isKeystoneUnlocked(building, buildingUnlocked: open, state) { result.append(key) }
            }
        }
        return result
    }

    public func playableUnsolved(_ state: GameState) -> [Lantern] {
        playableLanterns(state).filter { !isSolved($0, state) }
    }

    /// Lanterne proposée par « Continuer » : la plus proche de la dernière jouée
    /// (même salle, puis même bâtiment, puis même quartier, puis la suite du monde), jamais un retour en arrière arbitraire.
    public func recommended(_ state: GameState) -> Lantern? {
        let open = playableUnsolved(state)
        guard let last = state.lastPuzzle, let here = placeIndex[last] else { return open.first }
        func place(_ l: Lantern) -> (district: Int, building: Int, room: Int?) { placeIndex[l.puzzle]! }
        if let r = here.room, let same = open.first(where: { place($0).district == here.district && place($0).building == here.building && place($0).room == r }) {
            return same
        }
        if let building = open.first(where: { place($0).district == here.district && place($0).building == here.building }) { return building }
        if let district = open.first(where: { place($0).district == here.district }) { return district }
        return open.first(where: { place($0).district > here.district }) ?? open.first
    }

    /// Vrai si la lanterne est ouverte (jouable) dans cet état.
    public func isPlayable(_ id: PuzzleID, _ state: GameState) -> Bool {
        guard let place = placeIndex[id] else { return false }
        let district = world.districts[place.district]
        let total = totalLights(state), letterCount = letters(state)
        guard isUnlocked(district, totalLights: total, letters: letterCount) else { return false }
        let bi = place.building
        let open = bi == 0 || lights(district.buildings[bi - 1].allLanterns, state) >= rules.previousBuildingLights
        let building = district.buildings[bi]
        if let ri = place.room { return isUnlocked(room: ri, in: building, buildingUnlocked: open, state) }
        return isKeystoneUnlocked(building, buildingUnlocked: open, state)
    }

    /// Localise une lanterne : quartier, bâtiment, salle (nil pour une lanterne-clé).
    public func locate(_ id: PuzzleID) -> (district: District, building: Building, room: Room?)? {
        guard let place = placeIndex[id] else { return nil }
        let district = world.districts[place.district]
        let building = district.buildings[place.building]
        return (district, building, place.room.map { building.rooms[$0] })
    }
}
