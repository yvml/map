export type POI = {
    id: string;
    title: string;
    location: {
        latitude: number;
        longitude: number;
    };
    // TODO: non-optional
    imageName?: string;
    // TODO: non-optional
    audioName?: string;
};
