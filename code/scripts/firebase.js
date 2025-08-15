import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";  // Import config


// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();


// 🔹 Google Sign-In Function
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // If user doesn't exist, create a new document in Firestore
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                profilePicture: user.photoURL,
                location: "Not set",
                bio: "Write something about yourself...",
                videos: []
            });
        }

        console.log("User signed in:", user);
        window.location.href = "page-profile-1.html"; // Redirect to profile page

    } catch (error) {
        console.error("Google Sign-In Error:", error);
        alert("Google Sign-In failed. Please try again.");
    }
}

// 🔹 Logout Function
export function logout() {
    signOut(auth).then(() => {
        console.log("User logged out");
        window.location.href = "page-login.html"; // Redirect to login page
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}
