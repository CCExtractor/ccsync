import  app  from "./firebase";
import {collection, getFirestore} from "firebase/firestore";

export const firestore = getFirestore(app);

// tasks collection
export const tasksCollection = collection(firestore, "tasks")