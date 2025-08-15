import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM Loaded. Waiting for Firebase authentication...");

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.log("🚨 No user found. Redirecting to login.");
            window.location.href = "page-login.html";
            return;
        }

        console.log("✅ User is logged in:", user.email);

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log("📌 User data loaded:", userData);

            // ✅ Populate Profile Data
            document.getElementById("profile-name").textContent = userData.username || "Your Name";
            document.getElementById("profile-picture").src = userData.profilePicture || "default-profile.png";
            document.getElementById("followers-count").textContent = userData.followers || 0;
            document.getElementById("following-count").textContent = userData.following || 0;

            // ✅ Load User Reels
            loadUserReels(userData.videos || []);
        } else {
            console.log("🚨 No user data found in Firestore.");
        }

        // ✅ Add event listener for adding reels
        document.getElementById("add-video-btn").addEventListener("click", async () => {
            const videoURL = document.getElementById("video-url-input").value.trim();
            if (!videoURL) {
                alert("Please enter a valid Instagram Reel URL.");
                return;
            }

            const reelID = extractInstagramReelID(videoURL);
            if (!reelID) {
                alert("Invalid URL. Please enter a valid Instagram Reel link.");
                return;
            }

            // Prevent duplicate videos from being added
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().videos.includes(videoURL)) {
                alert("This reel has already been added.");
                return;
            }

            try {
                await updateDoc(userRef, {
                    videos: arrayUnion(videoURL)
                });

                console.log(`✅ Instagram Reel added successfully:`, videoURL);

                // Reload reels in the UI
                loadUserReels([...userSnap.data().videos, videoURL]);

                // Clear input field
                document.getElementById("video-url-input").value = "";
            } catch (error) {
                console.error("🔥 Error adding video:", error);
                alert("Failed to add video. Try again.");
            }
        });
    });
});

// ✅ Function to Load User Reels in a Scrollable Carousel
function loadUserReels(reels) {
    const videoList = document.getElementById("user-video-slider");
    const noVideosText = document.getElementById("no-videos-text");

    // Clear previous content
    videoList.innerHTML = "";

    if (reels.length > 0) {
        console.log("🎥 Loading user reels:", reels);
        noVideosText.style.display = "none";
        document.getElementById("posts-count").textContent = reels.length;

        reels.forEach(videoURL => {
            const reelID = extractInstagramReelID(videoURL);
            console.log(`🔍 Extracted Reel ID: ${reelID}`);

            if (!reelID) return;

            const videoSlide = document.createElement("li");
            videoSlide.classList.add("splide__slide");

            videoSlide.innerHTML = `
                <blockquote class="instagram-media"
                    data-instgrm-captioned
                    data-instgrm-permalink="https://www.instagram.com/reel/${reelID}/"
                    data-instgrm-version="14"
                    style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); 
                    margin:5px; max-width:540px; min-width:300px; min-height:700px; height:700px !important;">
                </blockquote>
                <button class="btn btn-sm btn-danger remove-reel-btn" data-url="${videoURL}">Remove</button>
            `;

            videoList.appendChild(videoSlide);
        });

        // ✅ Ensure Instagram embeds are processed
        ensureInstagramEmbedScript();

        // ✅ Destroy previous Splide instance if it exists
        if (window.splideInstance) {
            console.log("🔄 Destroying existing Splide instance...");
            window.splideInstance.destroy();
        }

        // ✅ Initialize Splide Carousel with auto height handling
        window.splideInstance = new Splide("#user-video-carousel", {
            type: "loop",
            perPage: 2, // Adjust for more visible reels
            perMove: 1,
            autoplay: true,
            gap: "1rem",
            pagination: false,
            arrows: true,
            drag: true,
            autoHeight: true, // Ensures each slide adjusts to its content
        }).mount();

        console.log("✅ Splide.js carousel initialized.");

        // ✅ Add event listeners to remove buttons
        document.querySelectorAll(".remove-reel-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
                const videoURL = event.target.getAttribute("data-url");
                await removeInstagramReel(videoURL);
            });
        });

    } else {
        console.log("🚨 No reels found for user.");
        noVideosText.style.display = "block";
        document.getElementById("posts-count").textContent = "0";
    }
}


// ✅ Extract Instagram Reel ID & Prevent Duplicates
function extractInstagramReelID(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[^/]+\/)?reel\/([A-Za-z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

ensureInstagramEmbedScript();

function ensureInstagramEmbedScript() {
    if (window.instgrm) {
        window.instgrm.Embeds.process();
    } else {
        let script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;function ensureInstagramEmbedScript() {
            if (window.instgrm) {
                setTimeout(() => {
                    window.instgrm.Embeds.process(); // Process embeds AFTER they load
                }, 500); // Small delay to ensure the elements exist before resizing
            } else {
                let script = document.createElement("script");
                script.src = "https://www.instagram.com/embed.js";
                script.async = true;
                script.onload = () => {
                    setTimeout(() => {
                        window.instgrm.Embeds.process();
                    }, 500);
                };
                document.body.appendChild(script);
            }
        }
        
        document.body.appendChild(script);
    }
}


new Splide("#user-video-carousel", {
    type: "loop",
    perPage: 3,
    perMove: 1,
    autoplay: true,
    gap: "1rem",
    pagination: false,
    arrows: true,
    drag: true,
    height: "auto",
    autoHeight: true, // Let Splide dynamically adjust height
}).mount();

async function removeInstagramReel(videoURL) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    try {
        await updateDoc(userRef, {
            videos: arrayRemove(videoURL) // Remove from Firestore
        });

        console.log(`❌ Removed Reel: ${videoURL}`);

        // ✅ Reload reels in the UI after deletion
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            loadUserReels(userSnap.data().videos || []);
        }

    } catch (error) {
        console.error("🔥 Error removing video:", error);
        alert("Failed to remove video. Try again.");
    }
}
