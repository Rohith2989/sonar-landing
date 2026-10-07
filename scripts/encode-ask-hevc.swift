// Safari delivery: preserve the alpha channel from the keyed ProRes master.
// Apple reference: https://developer.apple.com/videos/play/wwdc2019/506/
import Foundation
import AVFoundation

let arguments = CommandLine.arguments
if arguments.count != 3 {
    fputs("Usage: encode-ask-hevc INPUT.mov OUTPUT.mov\n", stderr)
    exit(1)
}
let inputURL = URL(fileURLWithPath: arguments[1])
let outputURL = URL(fileURLWithPath: arguments[2])
Task {
    do {
        let asset = AVURLAsset(url: inputURL)
        guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetHEVC1920x1080WithAlpha) else {
            throw NSError(domain: "AskVideo", code: 1, userInfo: [NSLocalizedDescriptionKey: "HEVC alpha export is unavailable"])
        }
        if FileManager.default.fileExists(atPath: outputURL.path) { try FileManager.default.removeItem(at: outputURL) }
        exporter.outputURL = outputURL
        exporter.outputFileType = .mov
        exporter.shouldOptimizeForNetworkUse = true
        await exporter.export()
        guard exporter.status == .completed else { throw exporter.error ?? NSError(domain: "AskVideo", code: 2) }
        let outputAsset = AVURLAsset(url: outputURL)
        let tracks = try await outputAsset.loadTracks(withMediaType: .video)
        guard let track = tracks.first, track.hasMediaCharacteristic(.containsAlphaChannel) else {
            throw NSError(domain: "AskVideo", code: 3, userInfo: [NSLocalizedDescriptionKey: "Export lost alpha"])
        }
        print("Saved HEVC with alpha: \(outputURL.path)")
        exit(0)
    } catch { fputs("\(error)\n", stderr); exit(1) }
}
dispatchMain()
