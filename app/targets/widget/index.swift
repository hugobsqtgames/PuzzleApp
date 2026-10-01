// Lampion's home-screen widget: the evening streak and tonight's challenge.
// The app writes a few values into the shared App Group (src/game/widget.ts);
// the widget only reads them. Nothing leaves the phone.
import SwiftUI
import WidgetKit

private let group = "group.app.lampion.game"

struct LampionEntry: TimelineEntry {
  let date: Date
  let streak: Int
  let doneTonight: Bool
  let family: String
  let lights: Int
  let english: Bool
}

struct LampionProvider: TimelineProvider {
  func placeholder(in context: Context) -> LampionEntry {
    LampionEntry(date: Date(), streak: 12, doneTonight: false, family: "Carillon", lights: 184, english: false)
  }

  func getSnapshot(in context: Context, completion: @escaping (LampionEntry) -> Void) {
    completion(read(at: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<LampionEntry>) -> Void) {
    let now = Date()
    // At midnight a new challenge is waiting: refresh then (the app also reloads the widget).
    let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    completion(Timeline(entries: [read(at: now), read(at: midnight)], policy: .after(midnight)))
  }

  private func read(at date: Date) -> LampionEntry {
    let d = UserDefaults(suiteName: group)
    let day = d?.string(forKey: "dailyDay") ?? ""
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.dateFormat = "yyyy-MM-dd"
    // The values were written for `dailyDay`: on another day, tonight's challenge is not done yet.
    let sameDay = day == f.string(from: date)
    return LampionEntry(
      date: date,
      streak: d?.integer(forKey: "streak") ?? 0,
      doneTonight: sameDay && (d?.integer(forKey: "dailyDone") ?? 0) == 1,
      family: sameDay ? (d?.string(forKey: "dailyFamily") ?? "") : "",
      lights: d?.integer(forKey: "lights") ?? 0,
      english: d?.string(forKey: "lang") == "en"
    )
  }
}

struct LampionWidgetView: View {
  @Environment(\.widgetFamily) var size
  let entry: LampionEntry

  private func t(_ fr: String, _ en: String) -> String { entry.english ? en : fr }

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 6) {
        Image(systemName: "flame.fill").foregroundStyle(Color("amber"))
        Text("Lampion").font(.system(.subheadline, design: .serif)).foregroundStyle(Color("ink"))
      }
      Spacer(minLength: 0)
      Text("\(entry.streak)")
        .font(.system(size: 40, weight: .bold, design: .serif))
        .foregroundStyle(Color("gold"))
      Text(entry.streak > 1 ? t("soirs de suite", "evenings in a row") : t("soir", "evening"))
        .font(.caption).foregroundStyle(Color("muted"))
      Text(entry.doneTonight ? t("Défi du soir réussi", "Tonight's challenge done") : t("Le défi du soir t’attend", "Tonight's challenge awaits"))
        .font(.caption.weight(.semibold))
        .foregroundStyle(entry.doneTonight ? Color("muted") : Color("amber"))
      if size != .systemSmall {
        HStack {
          if !entry.family.isEmpty { Text(entry.family).font(.caption2).foregroundStyle(Color("muted")) }
          Spacer()
          Text(t("\(entry.lights) lanternes", "\(entry.lights) lanterns")).font(.caption2).foregroundStyle(Color("muted"))
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .containerBackground(for: .widget) { Color("night") }
    .widgetURL(URL(string: "lampion:///daily"))
  }
}

@main
struct LampionWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "LampionWidget", provider: LampionProvider()) { entry in
      LampionWidgetView(entry: entry)
    }
    .configurationDisplayName("Lampion")
    .description("Le défi du soir et ta série. · Tonight's challenge and your streak.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
