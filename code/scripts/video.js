import { auth, db } from "./firebase.js";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

// Function to fetch and display videos
const fetchVideos = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const videoContainer = document.getElementById("video-container");
    videoContainer.innerHTML = ""; // Clear previous content

    try {
        const q = query(collection(db, "videos"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            const video = docSnap.data();
            const videoId = docSnap.id;

            // Create a video item
            const videoItem = document.createElement("div");
            videoItem.className = "col-6 col-md-4 mb-4";

            videoItem.innerHTML = `
                <iframe width="100%" height="200" src="${video.youtubeURL}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                <button class="btn btn-danger btn-sm mt-2 remove-video" data-id="${videoId}">Remove</button>
            `;

            videoContainer.appendChild(videoItem);
        });

        // Attach event listeners to delete buttons
        document.querySelectorAll(".remove-video").forEach((button) => {
            button.addEventListener("click", async (e) => {
                const videoId = e.target.getAttribute("data-id");
                await deleteDoc(doc(db, "videos", videoId));
                fetchVideos(); // Refresh videos after deletion
            });
        });
    } catch (error) {
        console.error("Error fetching videos:", error);
    }
};

// ✅ Call `fetchVideos()` when the page loads
document.addEventListener("DOMContentLoaded", () => {
    fetchVideos();
});
