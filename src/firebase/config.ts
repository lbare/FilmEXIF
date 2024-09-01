import { getApps, initializeApp, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
  Query,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { FilmRoll, Photo } from "../interfaces.tsx";

const firebaseConfig = {
  apiKey: "AIzaSyAOY73LntFR-3h3DxlXwnP7diUUfnWt85k",
  authDomain: "filmexif-e38ff.firebaseapp.com",
  projectId: "filmexif-e38ff",
  storageBucket: "filmexif-e38ff.appspot.com",
  messagingSenderId: "571498923203",
  appId: "1:571498923203:web:8955ac96f5e357688f8e76",
  measurementId: "G-MWGFVDZW85",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

const globalTimestampDocRef = doc(db, "metadata", "globalLastUpdated");

export const updateGlobalTimestamp = async (): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    await setDoc(globalTimestampDocRef, { lastUpdated: timestamp });
    localStorage.setItem("lastUpdated", timestamp);
  } catch (error) {
    console.error("Error updating global timestamp:", error);
  }
};

export const getGlobalLastUpdatedTimestamp = async (): Promise<
  string | null
> => {
  try {
    const docSnapshot = await getDoc(globalTimestampDocRef);
    if (docSnapshot.exists()) {
      return docSnapshot.data().lastUpdated || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching global timestamp:", error);
    return null;
  }
};

const getRollsByCollection = async (
  collectionName: string,
  newOnly = false
): Promise<FilmRoll[]> => {
  try {
    const rollsCollection = collection(db, collectionName);
    const lastDateStr = localStorage.getItem("lastUpdated");
    let q: Query<DocumentData>;

    if (newOnly && lastDateStr) {
      const lastDate = new Date(lastDateStr);
      q = query(
        rollsCollection,
        where("lastUpdated", ">", lastDate),
        orderBy("lastUpdated")
      );
    } else {
      q = query(rollsCollection);
    }

    const querySnapshot = await getDocs(q);
    const rolls: FilmRoll[] = [];

    querySnapshot.forEach((doc) => {
      rolls.push(doc.data() as FilmRoll);
    });

    return rolls;
  } catch (error) {
    console.error("Error getting rolls:", error);
    throw new Error("Failed to get rolls");
  }
};

export const getAllRolls = async (
  newOnly = false
): Promise<{
  activeRolls: FilmRoll[];
  developedRolls: FilmRoll[];
  completedRolls: FilmRoll[];
}> => {
  try {
    const activeRolls = await getRollsByCollection("activeRolls", newOnly);
    const developedRolls = await getRollsByCollection(
      "developedRolls",
      newOnly
    );
    const completedRolls = await getRollsByCollection(
      "completedRolls",
      newOnly
    );

    return { activeRolls, developedRolls, completedRolls };
  } catch (error) {
    console.error("Error getting all rolls:", error);
    throw new Error("Failed to get all rolls");
  }
};

export const addRollToFirebase = async (roll: FilmRoll) => {
  try {
    const rollsCollection = collection(db, "activeRolls");
    const timestamp = new Date().toISOString();
    const docRef = await addDoc(rollsCollection, { ...roll, timestamp });
    console.log("Roll added with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding roll:", error);
    throw new Error("Failed to add roll");
  }
};

export const uploadImageToFirebase = async (
  imageBase64: string,
  rollId: string,
  photoId: string
): Promise<string> => {
  try {
    const imageRef = ref(storage, `images/${rollId}/${photoId}.png`);
    await uploadString(imageRef, imageBase64, "data_url");
    const downloadURL = await getDownloadURL(imageRef);

    console.log("Image uploaded successfully:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};

export const addPhotoToRollInFirebase = async (
  rollId: string,
  newPhoto: Photo,
  imageBase64?: string
) => {
  try {
    let imageUrl: string | undefined = undefined;

    if (imageBase64) {
      imageUrl = await uploadImageToFirebase(imageBase64, rollId, newPhoto.id);
    }

    const rollsCollection = collection(db, "activeRolls");
    const q = query(rollsCollection, where("id", "==", rollId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Roll not found in the collection.");
    }

    const rollDoc = querySnapshot.docs[0];
    const rollData = rollDoc.data() as FilmRoll;

    const updatedPhoto = {
      ...newPhoto,
      ...(imageUrl && { imageUrl }),
    };

    const updatedPhotos = [...rollData.photos, updatedPhoto];

    const newTimestamp = new Date().toISOString();

    await updateDoc(doc(db, "activeRolls", rollDoc.id), {
      photos: updatedPhotos,
      lastUpdated: newTimestamp,
    });

    console.log(`Photo added to roll with ID: ${rollId}`);
  } catch (error) {
    console.error("Error adding photo to roll:", error);
    throw new Error("Failed to add photo to roll");
  }
};

export const deleteRollFromFirebase = async (
  rollId: string,
  stage: string
): Promise<void> => {
  try {
    const rollDocRef = doc(db, `${stage}Rolls`, rollId);
    await deleteDoc(rollDocRef);
    console.log("Roll deleted and global timestamp updated.");
  } catch (error) {
    console.error("Error deleting roll:", error);
    throw new Error("Failed to delete roll");
  }
};

export const moveRoll = async (
  rollId: string,
  currentStage: string,
  newStage: string
) => {
  try {
    const currentCollection =
      currentStage === "active"
        ? "activeRolls"
        : currentStage === "developed"
        ? "developedRolls"
        : "completedRolls";

    const newCollection =
      newStage === "active"
        ? "activeRolls"
        : newStage === "developed"
        ? "developedRolls"
        : "completedRolls";

    const rollsCollection = collection(db, currentCollection);
    const q = query(rollsCollection, where("id", "==", rollId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Roll not found in the current collection.");
    }

    const rollDoc = querySnapshot.docs[0];
    const rollData = rollDoc.data() as FilmRoll;

    const newTimestamp = new Date().toISOString();
    await addDoc(collection(db, newCollection), {
      ...rollData,
      lastUpdated: newTimestamp,
    });

    await deleteDoc(doc(db, currentCollection, rollDoc.id));

    localStorage.setItem("lastUpdated", newTimestamp);

    console.log(`Roll moved from ${currentStage} to ${newStage}`);
  } catch (error) {
    console.error("Error moving roll:", error);
    throw new Error("Failed to move roll");
  }
};

export { db };
