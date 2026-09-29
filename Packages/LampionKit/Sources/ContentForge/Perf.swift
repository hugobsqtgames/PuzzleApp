import FamilyLamps
import Foundation
import PuzzleKit

func perfLamps() {
    let f = LampsFamily()
    for n in [8, 10, 12, 14, 20] {
        let open = LampsPuzzle(layout: Array(repeating: String(repeating: ".", count: n), count: n))
        var t = Date(); _ = f.solve(open, limit: 2); let solveT = Date().timeIntervalSince(t)
        t = Date(); _ = f.hint(open, state: f.initialState(for: open), level: .lead); let hintT = Date().timeIntervalSince(t)
        var mixed = open.layout.map { Array($0) }
        for i in stride(from: 0, to: n * n, by: 5) { mixed[i / n][i % n] = "X" }
        let m = LampsPuzzle(layout: mixed.map { String($0) })
        t = Date(); _ = f.solve(m, limit: 2); let solveM = Date().timeIntervalSince(t)
        print("\(n)x\(n): solve open \(String(format: "%.3f", solveT))s hint open \(String(format: "%.3f", hintT))s solve walls \(String(format: "%.3f", solveM))s")
    }
}
