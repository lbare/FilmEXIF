export interface FilmRoll {
  id: string;
  name: string;
  camera: string;
  filmBrand: string;
  filmName: string;
  iso: number;
  exposures: number;
  photos: Photo[];
  isActive: boolean;
}

export interface Photo {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  date: string;
}
