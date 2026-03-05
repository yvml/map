import L from "leaflet";
import type { LocationPoint } from "./types";

type LocationSmootherParams = {
    tauMs: number;
    maxFrameDeltaMs: number;
    snapDistanceMeters: number;
    largeJumpMeters: number;
};

type IngestResult =
    | {
          type: "snap";
          point: LocationPoint;
      }
    | {
          type: "smooth";
      };

/**
 * Stateful smoothing engine for location updates.
 *
 * Consumers call `ingest()` for raw accepted fixes. This class owns the RAF
 * lifecycle and emits points via the provided callback.
 */
export class LocationSmoother {
    constructor({
        tauMs,
        maxFrameDeltaMs,
        snapDistanceMeters,
        largeJumpMeters,
    }: LocationSmootherParams) {
        this.tauMs = tauMs;
        this.maxFrameDeltaMs = maxFrameDeltaMs;
        this.snapDistanceMeters = snapDistanceMeters;
        this.largeJumpMeters = largeJumpMeters;
    }

    public reset = (): void => {
        this.stop();
        this.targetPoint = undefined;
        this.currentPoint = undefined;
    };

    public ingest = (
        nextPoint: LocationPoint,
        emit: (point: LocationPoint) => void,
    ): IngestResult => {
        // First valid fix after start: snap immediately.
        if (!this.targetPoint || !this.currentPoint) {
            this.targetPoint = nextPoint;
            this.currentPoint = nextPoint;
            this.stop();
            emit(nextPoint);
            return { type: "snap", point: nextPoint };
        }

        const jumpDistanceMeters = this.distanceMeters(this.targetPoint, nextPoint);
        this.targetPoint = nextPoint;

        // Large discontinuity (poor GPS/teleport): emit immediate snap.
        if (jumpDistanceMeters > this.largeJumpMeters) {
            this.currentPoint = nextPoint;
            this.stop();
            emit(nextPoint);
            return { type: "snap", point: nextPoint };
        }

        this.start(emit);
        return { type: "smooth" };
    };

    public stop = (): void => {
        if (this.frameId !== undefined) {
            cancelAnimationFrame(this.frameId);
            this.frameId = undefined;
        }
        this.lastFrameTs = undefined;
        this.emit = undefined;
    };

    private start = (emit: (point: LocationPoint) => void): void => {
        this.emit = emit;
        if (this.frameId !== undefined) {
            return;
        }
        this.lastFrameTs = undefined;
        this.frameId = requestAnimationFrame(this.step);
    };

    private step = (timestampMs: number): void => {
        if (!this.targetPoint || !this.currentPoint) {
            this.stop();
            return;
        }

        const dtMs =
            this.lastFrameTs === undefined
                ? 16
                : Math.max(0, timestampMs - this.lastFrameTs);
        this.lastFrameTs = timestampMs;

        // Clamp delta to avoid one-frame catch-up jumps after long frame gaps.
        const clampedDtMs = Math.min(dtMs, this.maxFrameDeltaMs);
        const alpha = 1 - Math.exp(-clampedDtMs / this.tauMs);

        this.currentPoint = this.interpolatePoint(
            this.currentPoint,
            this.targetPoint,
            alpha,
        );
        this.emit?.(this.currentPoint);

        const remainingDistanceMeters = this.distanceMeters(
            this.currentPoint,
            this.targetPoint,
        );
        if (remainingDistanceMeters < this.snapDistanceMeters) {
            this.currentPoint = {
                ...this.targetPoint,
                timestamp: Date.now(),
            };
            this.emit?.(this.currentPoint);
            this.stop();
            return;
        }

        this.frameId = requestAnimationFrame(this.step);
    };

    private interpolatePoint = (
        current: LocationPoint,
        target: LocationPoint,
        alpha: number,
    ): LocationPoint => {
        return {
            latitude:
                current.latitude + (target.latitude - current.latitude) * alpha,
            longitude:
                current.longitude +
                (target.longitude - current.longitude) * alpha,
            accuracy:
                current.accuracy + (target.accuracy - current.accuracy) * alpha,
            timestamp: Date.now(),
        };
    };

    private distanceMeters = (
        a: Pick<LocationPoint, "latitude" | "longitude">,
        b: Pick<LocationPoint, "latitude" | "longitude">,
    ): number => {
        return L.latLng(a.latitude, a.longitude).distanceTo(
            L.latLng(b.latitude, b.longitude),
        );
    };

    private targetPoint: LocationPoint | undefined;
    private currentPoint: LocationPoint | undefined;
    private emit: ((point: LocationPoint) => void) | undefined;
    private frameId: number | undefined;
    private lastFrameTs: number | undefined;
    private readonly tauMs: number;
    private readonly maxFrameDeltaMs: number;
    private readonly snapDistanceMeters: number;
    private readonly largeJumpMeters: number;
}
