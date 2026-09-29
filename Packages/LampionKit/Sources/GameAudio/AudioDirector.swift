import Foundation

// Son et haptique (DESIGN_SYSTEM § 15). Ce module DÉCIDE (quoi jouer, quand, à quel volume, avec quelle vibration) ;
// un moteur propre à la plateforme (AVAudioEngine + UIFeedbackGenerator sur iOS) EXÉCUTE les commandes.
// La logique est ainsi entièrement testable hors appareil.

public enum SoundEvent: String, CaseIterable, Codable, Sendable {
    case manipulate, error, lanternLit, shards, roomCompleted, buildingCompleted, unlock, newDistrict, hint, locked, uiTap
}

public enum AmbiencePlace: String, CaseIterable, Codable, Sendable {
    case night, lighthouse, library, clockworks, glasshouse, market, theatre, observatory
}

public enum Haptic: String, Codable, Sendable {
    case selection, success, error, impactSoft, impactMedium
}

public struct AudioSettings: Codable, Hashable, Sendable {
    public var music = true
    public var effects = true
    public var haptics = true
    /// Clic sur les boutons d'interface : coupé par défaut (DESIGN_SYSTEM § 15).
    public var interfaceTaps = false

    public init() {}

    enum CodingKeys: String, CodingKey { case music, effects, haptics, interfaceTaps }

    /// Décodage tolérant : un réglage abîmé reprend sa valeur par défaut, les autres sont conservés.
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        music = (try? c.decodeIfPresent(Bool.self, forKey: .music)) ?? true
        effects = (try? c.decodeIfPresent(Bool.self, forKey: .effects)) ?? true
        haptics = (try? c.decodeIfPresent(Bool.self, forKey: .haptics)) ?? true
        interfaceTaps = (try? c.decodeIfPresent(Bool.self, forKey: .interfaceTaps)) ?? false
    }
}

/// Description d'un son. Les noms de fichiers sont ceux attendus du sound designer (Content/audio/SOUND_BRIEF.md).
public struct SoundCue: Codable, Hashable, Sendable {
    public let file: String
    /// Gain linéaire 0...1 appliqué au fichier.
    public let volume: Double
    /// Intervalle minimal entre deux déclenchements (anti-rafale), en secondes.
    public let minimumInterval: TimeInterval
    /// Au plus une vibration par événement.
    public let haptic: Haptic?

    public init(file: String, volume: Double, minimumInterval: TimeInterval = 0, haptic: Haptic? = nil) {
        self.file = file; self.volume = volume; self.minimumInterval = minimumInterval; self.haptic = haptic
    }
}

public struct AmbienceCue: Codable, Hashable, Sendable {
    public let file: String
    public let volume: Double
    public init(file: String, volume: Double) { self.file = file; self.volume = volume }
}

public struct SoundManifest: Codable, Hashable, Sendable {
    public var effects: [SoundEvent: SoundCue]
    public var ambiences: [AmbiencePlace: AmbienceCue]
    /// Durée des fondus entre deux lieux (DESIGN_SYSTEM : 2 s).
    public var crossfade: TimeInterval = 2

    public init(effects: [SoundEvent: SoundCue], ambiences: [AmbiencePlace: AmbienceCue], crossfade: TimeInterval = 2) {
        self.effects = effects; self.ambiences = ambiences; self.crossfade = crossfade
    }

    /// Table de référence : événement → fichier, volume, anti-rafale, vibration (DESIGN_SYSTEM § 15.1).
    public static let standard = SoundManifest(
        effects: [
            .manipulate: SoundCue(file: "sfx_manipulate", volume: 0.5, minimumInterval: 0.035, haptic: .selection),
            .error: SoundCue(file: "sfx_error_soft", volume: 0.6, minimumInterval: 0.3, haptic: .error),
            .lanternLit: SoundCue(file: "sfx_lantern_lit", volume: 0.8, minimumInterval: 0.5, haptic: .success),
            .shards: SoundCue(file: "sfx_shards", volume: 0.45, minimumInterval: 0.2),
            .roomCompleted: SoundCue(file: "sfx_room_complete", volume: 0.85, minimumInterval: 1, haptic: .success),
            .buildingCompleted: SoundCue(file: "sfx_building_complete", volume: 0.85, minimumInterval: 1, haptic: .impactSoft),
            .unlock: SoundCue(file: "sfx_unlock", volume: 0.75, minimumInterval: 0.5, haptic: .impactMedium),
            .newDistrict: SoundCue(file: "sfx_new_district_theme", volume: 0.8, minimumInterval: 2, haptic: .impactSoft),
            .hint: SoundCue(file: "sfx_hint_whisper", volume: 0.5, minimumInterval: 0.3),
            .locked: SoundCue(file: "sfx_locked", volume: 0.5, minimumInterval: 0.3),
            .uiTap: SoundCue(file: "sfx_ui_tap", volume: 0.3, minimumInterval: 0.05),
        ],
        ambiences: Dictionary(uniqueKeysWithValues: AmbiencePlace.allCases.map { ($0, AmbienceCue(file: "amb_\($0.rawValue)", volume: 0.55)) })
    )
}

/// Ordres donnés au moteur audio de la plateforme.
public enum AudioCommand: Equatable, Sendable {
    case startAmbience(AmbiencePlace, file: String, volume: Double, fadeIn: TimeInterval)
    case crossfade(to: AmbiencePlace, file: String, volume: Double, duration: TimeInterval)
    case stopAmbience(fadeOut: TimeInterval)
    case playEffect(SoundEvent, file: String, volume: Double)
    case haptic(Haptic)
    /// Application en arrière-plan : tout est suspendu (batterie), rien n'est programmé.
    case suspend
    case resume
}

/// Machine à états du son. Toutes les méthodes renvoient les commandes à exécuter, dans l'ordre.
public struct AudioDirector: Sendable {
    public private(set) var settings: AudioSettings
    public let manifest: SoundManifest
    /// Lieu où se trouve le joueur (même si la musique est coupée).
    public private(set) var place: AmbiencePlace?
    /// Ambiance chargée dans le moteur (en lecture, ou en pause si l'app est en arrière-plan).
    public private(set) var playing: AmbiencePlace?
    public private(set) var isActive = true
    private var lastPlayed: [SoundEvent: TimeInterval] = [:]

    public init(settings: AudioSettings = AudioSettings(), manifest: SoundManifest = .standard) {
        self.settings = settings
        self.manifest = manifest
    }

    /// Le joueur entre dans un lieu (nil : écran sans ambiance).
    public mutating func enter(_ newPlace: AmbiencePlace?) -> [AudioCommand] {
        place = newPlace
        return reconcileAmbience()
    }

    /// Un événement de jeu se produit à l'instant `time` (horloge monotone, en secondes).
    public mutating func trigger(_ event: SoundEvent, at time: TimeInterval) -> [AudioCommand] {
        guard isActive, let cue = manifest.effects[event] else { return [] }
        if event == .uiTap && !settings.interfaceTaps { return [] }
        if let last = lastPlayed[event], time - last < cue.minimumInterval, time >= last { return [] }
        lastPlayed[event] = time
        var commands: [AudioCommand] = []
        if settings.effects { commands.append(.playEffect(event, file: cue.file, volume: cue.volume)) }
        if settings.haptics, let haptic = cue.haptic { commands.append(.haptic(haptic)) }
        return commands
    }

    public mutating func update(_ newSettings: AudioSettings) -> [AudioCommand] {
        settings = newSettings
        return reconcileAmbience()
    }

    public mutating func didEnterBackground() -> [AudioCommand] {
        guard isActive else { return [] }
        isActive = false
        return [.suspend]
    }

    public mutating func willEnterForeground() -> [AudioCommand] {
        guard !isActive else { return [] }
        isActive = true
        // L'horloge de l'anti-rafale peut avoir bougé pendant la suspension : on repart de zéro.
        lastPlayed.removeAll()
        return [.resume] + reconcileAmbience()
    }

    /// Ambiance voulue : celle du lieu si la musique est activée.
    public var wantedAmbience: AmbiencePlace? { settings.music ? place : nil }

    /// Aligne l'ambiance chargée sur l'ambiance voulue. En arrière-plan, l'ambiance est seulement
    /// mise en pause (`suspend`) et toute décision est différée jusqu'au retour au premier plan.
    private mutating func reconcileAmbience() -> [AudioCommand] {
        guard isActive else { return [] }
        let wanted = wantedAmbience
        guard wanted != playing else { return [] }
        defer { playing = wanted }
        guard let target = wanted, let cue = manifest.ambiences[target] else {
            return playing == nil ? [] : [.stopAmbience(fadeOut: manifest.crossfade)]
        }
        if playing == nil { return [.startAmbience(target, file: cue.file, volume: cue.volume, fadeIn: manifest.crossfade)] }
        return [.crossfade(to: target, file: cue.file, volume: cue.volume, duration: manifest.crossfade)]
    }
}
