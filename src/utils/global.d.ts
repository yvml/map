declare global {
    interface Window {
        ondeviceorientationabsolute?: (
            this: Window,
            ev: DeviceOrientationEvent,
        ) => unknown;
    }
}

export {};
