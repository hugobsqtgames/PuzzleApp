import Foundation
import Testing
@testable import GameAudio

@Suite("Directeur audio")
struct AudioDirectorTests {
    @Test("Chaque événement et chaque lieu ont un son ; au plus une vibration par événement")
    func manifestComplete() {
        for event in SoundEvent.allCases { #expect(SoundManifest.standard.effects[event] != nil, "\(event)") }
        for place in AmbiencePlace.allCases { #expect(SoundManifest.standard.ambiences[place] != nil, "\(place)") }
        for cue in SoundManifest.standard.effects.values { #expect((0...1).contains(cue.volume)) }
        #expect(Set(SoundManifest.standard.effects.values.map(\.file)).count == SoundEvent.allCases.count)
    }

    @Test("Entrer dans un lieu démarre l'ambiance ; changer de lieu enchaîne en fondu ; rester ne relance rien")
    func ambienceFlow() {
        var d = AudioDirector()
        #expect(d.enter(.lighthouse) == [.startAmbience(.lighthouse, file: "amb_lighthouse", volume: 0.55, fadeIn: 2)])
        #expect(d.enter(.lighthouse).isEmpty)
        #expect(d.enter(.clockworks) == [.crossfade(to: .clockworks, file: "amb_clockworks", volume: 0.55, duration: 2)])
        #expect(d.enter(nil) == [.stopAmbience(fadeOut: 2)])
        #expect(d.enter(nil).isEmpty)
    }

    @Test("Musique coupée : ambiance arrêtée ; rallumée : elle reprend là où est le joueur")
    func musicSetting() {
        var d = AudioDirector()
        _ = d.enter(.market)
        var s = d.settings; s.music = false
        #expect(d.update(s) == [.stopAmbience(fadeOut: 2)])
        #expect(d.enter(.theatre).isEmpty) // on change de lieu en silence
        s.music = true
        #expect(d.update(s) == [.startAmbience(.theatre, file: "amb_theatre", volume: 0.55, fadeIn: 2)])
    }

    @Test("Effets et vibrations respectent leurs réglages séparément")
    func effectAndHapticSettings() {
        var d = AudioDirector()
        #expect(d.trigger(.lanternLit, at: 0) == [.playEffect(.lanternLit, file: "sfx_lantern_lit", volume: 0.8), .haptic(.success)])
        var s = d.settings; s.effects = false
        _ = d.update(s)
        #expect(d.trigger(.lanternLit, at: 10) == [.haptic(.success)])
        s.haptics = false
        _ = d.update(s)
        #expect(d.trigger(.lanternLit, at: 20).isEmpty)
        #expect(d.trigger(.shards, at: 30).isEmpty)
    }

    @Test("Anti-rafale : 100 manipulations en une seconde ne donnent qu'une trentaine de sons")
    func rateLimit() {
        var d = AudioDirector()
        var played = 0
        for i in 0..<100 where !d.trigger(.manipulate, at: Double(i) * 0.01).isEmpty { played += 1 }
        #expect(played == 25) // un toutes les 40 ms (pas de 10 ms, seuil 35 ms)
        #expect(!d.trigger(.error, at: 5).isEmpty)
        #expect(d.trigger(.error, at: 5.1).isEmpty)
    }

    @Test("Horloge qui recule (appareil redémarré) : l'anti-rafale ne bloque pas les sons")
    func clockGoesBack() {
        var d = AudioDirector()
        _ = d.trigger(.hint, at: 1_000)
        #expect(!d.trigger(.hint, at: 3).isEmpty)
    }

    @Test("Clic d'interface coupé par défaut")
    func uiTapsOffByDefault() {
        var d = AudioDirector()
        #expect(d.trigger(.uiTap, at: 0).isEmpty)
        var s = d.settings; s.interfaceTaps = true
        _ = d.update(s)
        #expect(!d.trigger(.uiTap, at: 1).isEmpty)
    }

    @Test("Arrière-plan : tout est suspendu, aucun son ; retour : reprise et bonne ambiance")
    func lifecycle() {
        var d = AudioDirector()
        _ = d.enter(.library)
        #expect(d.didEnterBackground() == [.suspend])
        #expect(d.didEnterBackground().isEmpty)
        #expect(d.trigger(.lanternLit, at: 1).isEmpty)
        // Le lieu change pendant l'arrière-plan (restauration d'état) : décision différée, rien ne joue.
        #expect(d.enter(.observatory).isEmpty)
        #expect(d.willEnterForeground() == [.resume, .crossfade(to: .observatory, file: "amb_observatory", volume: 0.55, duration: 2)])
        #expect(d.willEnterForeground().isEmpty)
    }

    @Test("Stress : 10 000 actions aléatoires, l'ambiance jouée correspond toujours à l'état voulu")
    func stress() {
        var d = AudioDirector()
        var generator = SystemRandomNumberGenerator()
        var t = 0.0
        for _ in 0..<10_000 {
            t += Double.random(in: 0...0.2, using: &generator)
            switch Int.random(in: 0..<6, using: &generator) {
            case 0: _ = d.enter(AmbiencePlace.allCases.randomElement(using: &generator))
            case 1: var s = d.settings; s.music.toggle(); _ = d.update(s)
            case 2: _ = d.didEnterBackground()
            case 3: _ = d.willEnterForeground()
            default: _ = d.trigger(SoundEvent.allCases.randomElement(using: &generator)!, at: t)
            }
            if d.isActive { #expect(d.playing == d.wantedAmbience) }
        }
    }

    @Test("Réglages : décodage tolérant")
    func settingsDecoding() throws {
        let s = try JSONDecoder().decode(AudioSettings.self, from: Data(#"{"music":false,"effects":"oui","future":1}"#.utf8))
        #expect(!s.music && s.effects && s.haptics && !s.interfaceTaps)
    }
}
