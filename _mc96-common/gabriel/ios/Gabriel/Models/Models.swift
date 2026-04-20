import Foundation

// MARK: - Heaven API Response Types

struct HealthResponse: Codable {
    let status: String
    let service: String
    let version: String
    let timestamp: String
    let gabriel: String
    let hvs: String
    let portals: [String]
}

struct APIResponse<T: Codable>: Codable {
    let ok: Bool?
    let error: String?
    let detail: String?
}

struct FamilyMember: Codable, Identifiable {
    let id: String
    let email: String
    let displayName: String
    let hvsAcknowledged: Bool
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, email
        case displayName = "display_name"
        case hvsAcknowledged = "hvs_acknowledged"
        case createdAt = "created_at"
    }
}

struct RegisterResponse: Codable {
    let ok: Bool
    let memberId: String?

    enum CodingKeys: String, CodingKey {
        case ok
        case memberId = "member_id"
    }
}

struct ConsentResponse: Codable {
    let ok: Bool
    let consentId: String?
    let c2paStamp: String?

    enum CodingKeys: String, CodingKey {
        case ok
        case consentId = "consent_id"
        case c2paStamp = "c2pa_stamp"
    }
}

struct VoiceResponse: Codable {
    let ok: Bool
    let voiceId: String?
    let c2paStamp: String?

    enum CodingKeys: String, CodingKey {
        case ok
        case voiceId = "voice_id"
        case c2paStamp = "c2pa_stamp"
    }
}

struct MessageResponse: Codable {
    let ok: Bool
    let messageId: String?

    enum CodingKeys: String, CodingKey {
        case ok
        case messageId = "message_id"
    }
}

struct HealingSessionResponse: Codable {
    let ok: Bool
    let sessionId: String?

    enum CodingKeys: String, CodingKey {
        case ok
        case sessionId = "session_id"
    }
}

struct GabrielEvent: Codable, Identifiable {
    let id: String
    let eventType: String
    let targetId: String?
    let payload: String?
    let loggedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case eventType = "event_type"
        case targetId = "target_id"
        case payload
        case loggedAt = "logged_at"
    }
}

struct GabrielResponse: Codable {
    let ok: Bool
    let actorId: String
    let events: [GabrielEvent]

    enum CodingKeys: String, CodingKey {
        case ok
        case actorId = "actor_id"
        case events
    }
}

// MARK: - Portal

enum Portal: String, CaseIterable, Identifiable {
    case noizyvox = "NOIZYVOX"
    case noizyfish = "NOIZYFISH"
    case noizykidz = "NOIZYKIDZ"
    case noizylab = "NOIZYLAB"
    case wisdom = "WISDOM"
    case myfamily = "myFAMILY"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .noizyvox: return "NOIZY VOX"
        case .noizyfish: return "NOIZY FISH"
        case .noizykidz: return "NOIZY KIDZ"
        case .noizylab: return "NOIZY LAB"
        case .wisdom: return "WISDOM"
        case .myfamily: return "myFAMILY"
        }
    }

    var icon: String {
        switch self {
        case .noizyvox: return "waveform"
        case .noizyfish: return "music.note"
        case .noizykidz: return "figure.and.child.holdinghands"
        case .noizylab: return "flask"
        case .wisdom: return "book"
        case .myfamily: return "person.3"
        }
    }

    var description: String {
        switch self {
        case .noizyvox: return "Voice sovereignty & synthesis"
        case .noizyfish: return "Music & royalties"
        case .noizykidz: return "Youth creative protection"
        case .noizylab: return "Research & development"
        case .wisdom: return "Knowledge & heritage"
        case .myfamily: return "Family voice legacy"
        }
    }
}
