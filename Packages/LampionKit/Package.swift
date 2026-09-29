// swift-tools-version: 6.0
import PackageDescription

// Cœur de Lampion en Swift pur : aucune dépendance à SwiftUI/UIKit,
// compilable et testable sur macOS comme sur Linux.
let package = Package(
    name: "LampionKit",
    platforms: [.iOS(.v18), .macOS(.v15)],
    products: [
        .library(name: "PuzzleKit", targets: ["PuzzleKit"]),
        .library(name: "PuzzleFamilies", targets: ["FamilySwitches", "FamilyLocks", "FamilyLamps"]),
        .library(name: "GameCore", targets: ["GameCore"]),
        .library(name: "Persistence", targets: ["Persistence"]),
        .executable(name: "contentforge", targets: ["ContentForge"]),
    ],
    targets: [
        .target(name: "PuzzleKit"),
        .target(name: "FamilySwitches", dependencies: ["PuzzleKit"], path: "Sources/Families/Switches"),
        .target(name: "FamilyLocks", dependencies: ["PuzzleKit"], path: "Sources/Families/Locks"),
        .target(name: "FamilyLamps", dependencies: ["PuzzleKit"], path: "Sources/Families/Lamps"),
        .target(name: "GameCore", dependencies: ["PuzzleKit"]),
        .target(name: "Persistence", dependencies: ["GameCore"]),
        .executableTarget(
            name: "ContentForge",
            dependencies: ["PuzzleKit", "FamilySwitches", "FamilyLocks", "FamilyLamps"]
        ),
        .testTarget(name: "PuzzleKitTests", dependencies: ["PuzzleKit"]),
        .testTarget(name: "FamiliesTests", dependencies: ["PuzzleKit", "FamilySwitches", "FamilyLocks", "FamilyLamps"]),
        .testTarget(name: "GameCoreTests", dependencies: ["GameCore", "PuzzleKit"]),
        .testTarget(name: "PersistenceTests", dependencies: ["Persistence", "GameCore"]),
    ]
)
