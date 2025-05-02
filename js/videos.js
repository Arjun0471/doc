// Wait until the HTML document is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const API_KEY = 'AIzaSyDqktWfdAYPhQKPhZ9s1_p-0cjicAWxGMs'; // <--- PASTE YOUR API KEY HERE!
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
    const VIDEOS_PER_PAGE = 9; // How many videos to show per page

    // --- DOM Elements ---
    const videoGrid = document.getElementById('videoGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const loadingMessage = document.getElementById('loadingMessage');
    const paginationControls = document.getElementById('paginationControls'); // Get the pagination container

    // --- State Variables ---
    let allVideosData = []; // Stores raw data fetched & processed from API
    let filteredVideosData = []; // Stores data after search/category filter applied
    let uniqueCategories = new Set();
    let currentPage = 1; // Current page number

    // --- Check API Key and Video IDs (Same as before) ---
    if (API_KEY === 'YOUR_API_KEY' || !API_KEY || API_KEY === 'YOUR_NEW_API_KEY') { /* ... error handling ... */ return; }
    if (!VIDEO_IDS || VIDEO_IDS.length === 0) { /* ... error handling ... */ return; }

    // --- Fetch Video Data from YouTube API (Function remains the same) ---
    function fetchVideoData() {
        const idsString = VIDEO_IDS.join(',');
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${idsString}&key=${API_KEY}`;
        console.log("Attempting API call from:", document.location.href);

        fetch(apiUrl)
            .then(response => { /* ... error handling ... */ return response.json(); })
            .then(data => {
                allVideosData = processApiResponse(data.items || []);
                filteredVideosData = allVideosData; // Initially, filtered is all
                populateCategories(allVideosData);
                renderPage(); // Initial render of page 1
                if (loadingMessage) loadingMessage.style.display = 'none';
            })
            .catch(error => { /* ... error handling ... */ });
    }

    // --- Process API Response Data (Function remains the same) ---
    function processApiResponse(items) { /* ... returns mapped video data ... */
       return items.map(item => ({
            id: item.id,
            title: item.snippet?.title || 'No title',
            description: item.snippet?.description?.substring(0, 100) + '...' || 'No description',
            category: item.snippet?.tags?.[0] || 'General',
            videoId: item.id,
            platform: 'youtube'
        }));
    }

    // --- Populate Category Filter (Function remains the same) ---
    function populateCategories(videos) { /* ... populates dropdown ... */ }


    // --- NEW: Render Current Page (Combines Display & Pagination) ---
    function renderPage() {
        displayVideosForCurrentPage(filteredVideosData);
        renderPaginationControls(filteredVideosData);
    }

    // --- MODIFIED: Display Videos (Now considers pagination) ---
    function displayVideosForCurrentPage(videosToDisplay) {
        if (!videoGrid) { console.error("Video grid container not found."); return; }
        videoGrid.innerHTML = ''; // Clear existing grid content

        if (videosToDisplay.length === 0) {
            videoGrid.innerHTML = '<p class="text-gray-600 col-span-full text-center">No videos found matching your criteria.</p>';
            return;
        }

        // Calculate videos for the current page
        const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
        const endIndex = startIndex + VIDEOS_PER_PAGE;
        const videosOnPage = videosToDisplay.slice(startIndex, endIndex);

        if (videosOnPage.length === 0 && currentPage > 1) {
             // Handle cases where filter results in empty page beyond page 1
             currentPage = 1; // Go back to page 1
             displayVideosForCurrentPage(videosToDisplay); // Re-render page 1
             return;
        }


        videosOnPage.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105';

            const embedCode = `<iframe class="w-full h-auto aspect-video" src="https://www.youtube.com/embed/${video.videoId}" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

            videoCard.innerHTML = `
                <div class="w-full">${embedCode}</div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-1">${video.title}</h3>
                    <p class="text-sm text-gray-600 mb-2">${video.description}</p>
                    <span class="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">${video.category}</span>
                </div>
            `;
            videoGrid.appendChild(videoCard);
        });
    }

    // --- NEW: Render Pagination Controls ---
    function renderPaginationControls(videosToPaginate) {
        if (!paginationControls) { console.error("Pagination controls container not found."); return; }
        paginationControls.innerHTML = ''; // Clear old controls

        const totalVideos = videosToPaginate.length;
        const totalPages = Math.ceil(totalVideos / VIDEOS_PER_PAGE);

        if (totalPages <= 1) return; // No controls needed for 1 page or less

        // Page x of y Indicator
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-sm text-gray-700';
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.className = 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(); // Re-render videos and controls
            }
        });

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.className = 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage(); // Re-render videos and controls
            }
        });

        // Add controls to the container
        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(pageInfo); // Add page indicator between buttons
        paginationControls.appendChild(nextButton);
    }


    // --- MODIFIED: Filter and Search Logic (Resets pagination) ---
    function filterAndDisplayVideos() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';

        filteredVideosData = allVideosData.filter(video => { // Update filtered data
            const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
            const matchesSearch = video.title.toLowerCase().includes(searchTerm) || video.description.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        currentPage = 1; // Reset to page 1 whenever filters change
        renderPage();    // Render page 1 of filtered results
    }

    // --- Event Listeners (Remain the same) ---
    if (searchInput) { searchInput.addEventListener('input', filterAndDisplayVideos); }
    if (categoryFilter) { categoryFilter.addEventListener('change', filterAndDisplayVideos); }

    // --- Initial Load ---
    fetchVideoData(); // Start the process

}); // End of DOMContentLoaded