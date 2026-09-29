import Foundation
import Testing
@testable import FamilyLamps
@testable import FamilyLocks
@testable import FamilySwitches
@testable import PuzzleKit

/// Non-régression de l'audit : données malformées, états incohérents, fuites d'indices.
@Suite("Robustesse des familles")
struct RobustnessTests {
    let lampsPrototype = LampsPuzzle(layout: [".X..XX", "..3...", "XXXX..", "..XX2X", "...X..", "X2..X."])
    let lockPrototype = LocksPuzzle(length: 3, clues: [
        LockClue(guess: [2, 6, 1], wellPlaced: 0, misplaced: 1), LockClue(guess: [3, 4, 9], wellPlaced: 0, misplaced: 2),
        LockClue(guess: [9, 7, 6], wellPlaced: 0, misplaced: 1), LockClue(guess: [3, 4, 7], wellPlaced: 0, misplaced: 1),
        LockClue(guess: [1, 8, 5], wellPlaced: 0, misplaced: 0),
    ])

    @Test("Contenu malformé refusé au décodage", arguments: [
        #"{"rows":3,"columns":3,"pattern":"cross","initiallyLit":[true,false]}"#,
        #"{"rows":-3,"columns":-3,"pattern":"cross","initiallyLit":[true,true,true,true,true,true,true,true,true]}"#,
        #"{"rows":9,"columns":9,"pattern":"cross","initiallyLit":[]}"#,
    ])
    func switchesDecoding(json: String) {
        #expect(throws: (any Error).self) { try JSONDecoder().decode(SwitchesPuzzle.self, from: Data(json.utf8)) }
    }

    @Test("Cadenas malformés refusés : indice de mauvaise longueur, symbole hors alphabet, espace de recherche énorme")
    func locksDecoding() {
        for json in [
            #"{"length":3,"alphabet":10,"allowsRepeats":false,"clues":[{"guess":[1,2],"wellPlaced":0,"misplaced":0}]}"#,
            #"{"length":3,"alphabet":10,"allowsRepeats":false,"clues":[{"guess":[1,2,42],"wellPlaced":0,"misplaced":0}]}"#,
            #"{"length":3,"alphabet":10,"allowsRepeats":false,"clues":[{"guess":[1,2,3],"wellPlaced":2,"misplaced":2}]}"#,
            #"{"length":8,"alphabet":36,"allowsRepeats":true,"clues":[]}"#,
        ] {
            #expect(throws: (any Error).self) { try JSONDecoder().decode(LocksPuzzle.self, from: Data(json.utf8)) }
        }
        #expect(throws: Never.self) { try JSONDecoder().decode(LocksPuzzle.self, from: JSONEncoder().encode(lockPrototype)) }
    }

    @Test("Grilles de Lampes malformées refusées")
    func lampsDecoding() {
        for json in [#"{"layout":["...",".."]}"#, #"{"layout":[]}"#, #"{"layout":["..9"]}"#, #"{"layout":[""]}"#] {
            #expect(throws: (any Error).self) { try JSONDecoder().decode(LampsPuzzle.self, from: Data(json.utf8)) }
        }
    }

    @Test("Paramètres absurdes : la génération renvoie nil sans planter")
    func absurdParameters() {
        var rng = SeededRNG(seed: 1)
        #expect(SwitchesFamily().generate(SwitchesParameters(rows: 3, columns: 3, presses: -4...(-2)), rng: &rng) == nil)
        #expect(SwitchesFamily().generate(SwitchesParameters(rows: 0, columns: 5, presses: 1...3), rng: &rng) == nil)
        #expect(SwitchesFamily().generate(SwitchesParameters(rows: -2, columns: -3, presses: 1...3), rng: &rng) == nil)
        #expect(LocksFamily().generate(LocksParameters(length: 9, alphabet: 36, allowsRepeats: true), rng: &rng) == nil)
        #expect(LocksFamily().generate(LocksParameters(length: 4, alphabet: 3), rng: &rng) == nil)
        #expect(LocksFamily().generate(LocksParameters(length: 1, alphabet: 10), rng: &rng) == nil)
    }

    @Test("Aléatoire : intervalle complet et bornes extrêmes sans dépassement")
    func rngExtremes() {
        var rng = SeededRNG(seed: 3)
        _ = rng.int(in: Int.min...Int.max)
        for _ in 0..<1_000 {
            #expect((Int.max - 1...Int.max).contains(rng.int(in: Int.max - 1...Int.max)))
            #expect((Int.min...Int.min + 2).contains(rng.int(in: Int.min...Int.min + 2)))
        }
        #expect(rng.int(in: 5...5) == 5)
    }

    @Test("Seuils de paliers incohérents refusés au décodage ; score borné au décodage")
    func thresholdsAndScoreDecoding() throws {
        #expect(throws: (any Error).self) { try JSONDecoder().decode(TierThresholds.self, from: Data(#"{"lowerBounds":[1,2,3,4,5,6,7]}"#.utf8)) }
        #expect(throws: (any Error).self) { try JSONDecoder().decode(TierThresholds.self, from: Data(#"{"lowerBounds":[50,40,30,20,10]}"#.utf8)) }
        #expect(try JSONDecoder().decode(DifficultyScore.self, from: Data(#"{"value":500}"#.utf8)).value == 100)
    }

    @Test("États de taille incohérente : aucune opération ne plante")
    func mismatchedStates() {
        let sw = SwitchesPuzzle(rows: 3, columns: 3, pattern: .cross, initiallyLit: [true, false, true, false, true, false, true, false, true])
        var short = SwitchesState(lit: [true])
        SwitchesFamily().press(4, state: &short, puzzle: sw)
        SwitchesFamily().press(99, state: &short, puzzle: sw)
        #expect(SwitchesFamily().validate(sw, state: short) == .incomplete)
        for level in HintLevel.allCases {
            #expect(SwitchesFamily().hint(sw, state: short, level: level) == nil)
            #expect(LocksFamily().hint(lockPrototype, state: LocksState(symbols: [4]), level: level) == nil)
            #expect(LampsFamily().hint(lampsPrototype, state: LampsState(marks: [.lamp]), level: level) == nil)
        }
        #expect(LampsFamily().validate(lampsPrototype, state: LampsState(marks: [])) == .incomplete)
        #expect(LampsFamily().illumination(lampsPrototype, state: LampsState(marks: [.lamp])).conflicts.isEmpty)
        #expect(LocksFamily().validate(lockPrototype, state: LocksState(symbols: [4, 9, 2, 1])) == .incomplete)
        #expect(LocksFamily().validate(lockPrototype, state: LocksState(symbols: [4, 9, 99])) != .correct)
    }

    @Test("Une lampe posée sur un mur ne satisfait jamais un nombre")
    func lampOnWall() {
        let p = LampsPuzzle(layout: ["...", ".1X", "..."])
        var s = LampsFamily().initialState(for: p)
        s.marks[5] = .lamp // sur le mur X
        s.marks[0] = .lamp; s.marks[8] = .lamp
        #expect(LampsFamily().validate(p, state: s) != .correct)
    }

    @Test("Révélation progressive : le Murmure et la Piste ne désignent jamais une seule case")
    func revealIsProgressive() throws {
        let family = LampsFamily()
        let board = LampsBoard(lampsPrototype)
        let solution: Set<Int> = [0, 2, 7, 9, 16, 18, 25, 28, 32, 35]
        let empty = family.initialState(for: lampsPrototype)
        let whisper = try #require(family.revealHint(board: board, state: empty, solutionLamps: solution, level: .whisper))
        let lead = try #require(family.revealHint(board: board, state: empty, solutionLamps: solution, level: .lead))
        let insight = try #require(family.revealHint(board: board, state: empty, solutionLamps: solution, level: .insight))
        #expect(whisper.focus.count == 6 && whisper.resultingState == nil)
        #expect(lead.focus.count == 11 && lead.resultingState == nil)
        #expect(insight.focus == [CellRef(0, 0)] && insight.resultingState?.marks[0] == .lamp)
    }
}
