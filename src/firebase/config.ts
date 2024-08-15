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
  doc,
} from "firebase/firestore";
import { FilmRoll } from "../interfaces.tsx";

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

const getRollsByCollection = async (
  collectionName: string,
  newOnly = false
): Promise<FilmRoll[]> => {
  try {
    const rollsCollection = collection(db, collectionName);
    const lastDateStr = localStorage.getItem("lastUpdated");

    let q: Query<DocumentData>;
    if (newOnly && lastDateStr) {
      q = query(
        rollsCollection,
        where("date", "<=", lastDateStr),
        orderBy("date")
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

export const getAllRolls = async (): Promise<{
  activeRolls: FilmRoll[];
  developedRolls: FilmRoll[];
  completedRolls: FilmRoll[];
}> => {
  try {
    const activeRolls = await getRollsByCollection("activeRolls");
    const developedRolls = await getRollsByCollection("developedRolls");
    const completedRolls = await getRollsByCollection("completedRolls");

    return { activeRolls, developedRolls, completedRolls };
  } catch (error) {
    console.error("Error getting all rolls:", error);
    throw new Error("Failed to get all rolls");
  }
};

export const addRollToFirebase = async (roll: FilmRoll): Promise<void> => {
  try {
    const rollsCollection = collection(db, "activeRolls");
    const docRef = await addDoc(rollsCollection, roll);
    console.log("Roll added with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding roll:", error);
    throw new Error("Failed to add roll");
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

    await addDoc(collection(db, newCollection), {
      ...rollData,
      stage: newStage,
    });

    await deleteDoc(doc(db, currentCollection, rollDoc.id));

    console.log(`Roll moved from ${currentStage} to ${newStage}`);
  } catch (error) {
    console.error("Error moving roll:", error);
    throw new Error("Failed to move roll");
  }
};

export { db };
