export interface FilmRoll {
  camera: string;
  brand: string;
  name: string;
  iso: number;
  exposures: number;
  photos: Photo[];
}

export interface Photo {
  location: {
    latitude: number;
    longitude: number;
  };
  date: string;
}
