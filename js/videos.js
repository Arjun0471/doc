// Wait until the HTML document is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const API_KEY = 'AIzaSyDqktWfdAYPhQKPhZ9s1_p-0cjicAWxGMs'; // <--- PASTE YOUR API KEY HERE!
    // List of YouTube Video IDs you want to display
    const VIDEO_IDS = [
        'ietM5QjjvVw',
        '6ZUYSSrB7cY',
        'DYGTvj7RexI',
        'E9gBz8peMDQ',
        'u98LQMZ16sA',
        '3bTNA8PQBH0',
        '2DfRHNo8uuw',
        'xkJqe_ktJrg',
        'qkg_YWTY9zY',
        '0m1PApxl7A0',
        'k046d3AZ6Wk',
        'UA2OHMHnsGQ'
    ];

    // --- DOM Elements ---
    const videoGrid = document.getElementById('videoGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter'); // We might get category from API later
    const loadingMessage = document.getElementById('loadingMessage');

    let allVideosData = []; // To store processed video data from API
    let uniqueCategories = new Set(); // To store unique category names

    // --- Check if API Key is set ---
    if (API_KEY === 'YOUR_API_KEY' || !API_KEY) {
        console.error("API Key not set in js/videos.js. Please replace 'YOUR_API_KEY'.");
        if (loadingMessage) loadingMessage.textContent = 'Error: API Key not configured.';
        if (videoGrid) videoGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">API Key not configured.</p>';
        return; // Stop execution if key is missing
    }
    if (!VIDEO_IDS || VIDEO_IDS.length === 0) {
         if (loadingMessage) loadingMessage.textContent = 'No video IDs specified.';
         if (videoGrid) videoGrid.innerHTML = '<p class="text-orange-500 text-center col-span-full">No video IDs have been specified in the code.</p>';
         return;
    }


    // --- Fetch Video Data from YouTube API ---
    function fetchVideoData() {
        // Construct the API URL
        // We fetch details ('snippet') and potentially 'contentDetails' for duration etc.
        const idsString = VIDEO_IDS.join(',');
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${idsString}&key=${API_KEY}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    // Try to parse error message from YouTube API response
                    return response.json().then(err => {
                         throw new Error(`YouTube API error: ${response.status} - ${err.error?.message || 'Unknown error'}`);
                    });
                }
                return response.json(); // Parse the JSON data
            })
            .then(data => {
                // Process the API response
                allVideosData = processApiResponse(data.items || []); // data.items contains the array of videos
                populateCategories(allVideosData); // Populate filter based on processed data
                displayVideos(allVideosData); // Display videos
                if (loadingMessage) loadingMessage.style.display = 'none'; // Hide loading message
            })
            .catch(error => {
                console.error('Error fetching or processing YouTube data:', error);
                if (videoGrid) {
                    videoGrid.innerHTML = `<p class="text-red-500 col-span-full">Could not load video data from YouTube API. Error: ${error.message}. Please check console for details.</p>`;
                }
                 if (loadingMessage) loadingMessage.style.display = 'none';
            });
    }

    // --- Process API Response Data ---
    function processApiResponse(items) {
        // Transform API data into a structure similar to our old videos.json for consistency
        return items.map(item => ({
            id: item.id, // YouTube video ID
            title: item.snippet?.title || 'No title',
            description: item.snippet?.description?.substring(0, 100) + '...' || 'No description', // Shorten description
            category: item.snippet?.tags?.[0] || 'General', // Use first tag as category, or default
            // Alternatively, you might manage categories separately if tags aren't suitable
            videoId: item.id,
            platform: 'youtube' // Platform is always YouTube here
            // Add other details if needed, e.g., item.contentDetails.duration
        }));
    }

    // --- Populate Category Filter ---
     function populateCategories(videos) {
        uniqueCategories.clear(); // Clear previous categories
        uniqueCategories.add('all'); // Add 'all' option
        videos.forEach(video => {
            if (video.category) {
                 uniqueCategories.add(video.category);
            }
        });

        // Only update dropdown if it exists
        if (categoryFilter) {
            // Store current selection to reapply if possible
            const currentSelection = categoryFilter.value;
            categoryFilter.innerHTML = ''; // Clear existing options
            uniqueCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category === 'all' ? 'All Categories' : category;
                categoryFilter.appendChild(option);
            });
             // Reapply selection
            if (uniqueCategories.has(currentSelection)) {
                 categoryFilter.value = currentSelection;
            } else {
                 categoryFilter.value = 'all';
            }
        } else {
            console.warn("Category filter dropdown not found in HTML.");
        }
    }


    // --- Display Videos (Iframe part is the same as corrected before) ---
    function displayVideos(videosToDisplay) {
        if (!videoGrid) {
            console.error("Video grid container not found in HTML.");
            return;
        }
        videoGrid.innerHTML = ''; // Clear existing grid content

        if (videosToDisplay.length === 0) {
            videoGrid.innerHTML = '<p class="text-gray-600 col-span-full text-center">No videos found matching your criteria.</p>';
            return;
        }

        videosToDisplay.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105'; // Tailwind classes

            // YouTube embed code (assuming platform is always 'youtube' now)
            const embedCode = `<iframe class="w-full h-auto aspect-video" src="https://www.youtube.com/embed/${video.videoId}" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

            videoCard.innerHTML = `
                <div class="w-full">
                    ${embedCode}
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-1">${video.title}</h3>
                    <p class="text-sm text-gray-600 mb-2">${video.description}</p>
                    <span class="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">${video.category}</span>
                </div>
            `;
            videoGrid.appendChild(videoCard);
        });
    }

    // --- Filter and Search Logic (Uses the fetched 'allVideosData') ---
    function filterAndDisplayVideos() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';

        const filteredVideos = allVideosData.filter(video => {
            const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
            // Search in title and description
            const matchesSearch = video.title.toLowerCase().includes(searchTerm) || video.description.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        displayVideos(filteredVideos);
    }

    // --- Event Listeners ---
    if (searchInput) {
        searchInput.addEventListener('input', filterAndDisplayVideos);
    } else {
        console.warn("Search input not found in HTML.");
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndDisplayVideos);
    } else {
        console.warn("Category filter dropdown not found in HTML.");
    }

    // --- Initial Load ---
    fetchVideoData(); // Start the process by fetching data from YouTube API

}); // End of DOMContentLoaded