export interface FilmRoll {
  name?: string;
  camera: string;
  filmBrand: string;
  filmName: string;
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
