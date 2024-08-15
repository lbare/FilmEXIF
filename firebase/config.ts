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
import { FilmRoll } from "../src/interfaces.tsx";

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

const getActiveRolls = async (newOnly = false) => {
  try {
    return await getRollsByCollection("activeRolls", newOnly);
  } catch (error) {
    console.error("Error getting active rolls:", error);
    throw new Error("Failed to get active rolls");
  }
};

const getDevelopedRolls = async (newOnly = false) => {
  try {
    return await getRollsByCollection("developedRolls", newOnly);
  } catch (error) {
    console.error("Error getting developed rolls:", error);
    throw new Error("Failed to get developed rolls");
  }
};

const getCompletedRolls = async (newOnly = false) => {
  try {
    return await getRollsByCollection("completedRolls", newOnly);
  } catch (error) {
    console.error("Error getting completed rolls:", error);
    throw new Error("Failed to get completed rolls");
  }
};

export const getAllRolls = async () => {
  try {
    const activeRolls = await getActiveRolls();
    const developedRolls = await getDevelopedRolls();
    const completedRolls = await getCompletedRolls();

    return { activeRolls, developedRolls, completedRolls };
  } catch (error) {
    console.error("Error getting all rolls:", error);
    throw new Error("Failed to get all rolls");
  }
};

export const addRoll = async (roll: FilmRoll) => {
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
