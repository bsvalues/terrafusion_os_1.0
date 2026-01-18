// scripts/ci/tests/renovateScopeSanity.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateRenovateScope } from "../renovateScopeSanity.js";

describe("Renovate Scope Validator", () => {
    const mockExit = vi.fn();
    const mockLog = vi.fn();
    const mockError = vi.fn();
    const mockWriteJson = vi.fn();

    const makeIO = (config, files) => ({
        readJson: () => config,
        writeJson: mockWriteJson,
        listFiles: () => files || [],
        log: mockLog,
        error: mockError,
        exit: mockExit
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fails if includePaths is missing", () => {
        validateRenovateScope(makeIO({}));
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(mockError).toHaveBeenCalledWith(expect.stringContaining("missing"));
    });

    it("fails on unsafe patterns", () => {
        validateRenovateScope(makeIO({ includePaths: ["**/package.json"] }));
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(mockError).toHaveBeenCalledWith(expect.stringContaining("Unsafe glob patterns"));
    });

    it("passes on safe patterns matches", () => {
        const config = { includePaths: ["frontend/**", "package.json"] };
        const files = [
            "frontend/package.json",
            "frontend/sub/package.json",
            "package.json",
            "backend/package.json" // Should be ignored
        ];
        
        validateRenovateScope(makeIO(config, files));
        
        expect(mockExit).toHaveBeenCalledWith(0);
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("RENOVATE_SCOPE_OK"));
        // Matches: frontend/package.json, frontend/sub/package.json, package.json (3 total)
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("3 manifests matched"));
        expect(mockWriteJson).toHaveBeenCalledWith(expect.stringContaining("snapshot"), expect.objectContaining({
            status: "OK",
            metrics: expect.objectContaining({ matchedCount: 3 })
        }));
    });
    
     it("fails if scope exceeds limit", () => {
        const config = { includePaths: ["frontend/**"] };
        // Create 61 mock files
        const files = Array.from({ length: 70 }, (_, i) => `frontend/pkg-${i}/package.json`);
        
        validateRenovateScope(makeIO(config, files));
        
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(mockError).toHaveBeenCalledWith(expect.stringContaining("Scope too large"));
    });
});
