/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Force a static export (creates an /out folder)
    output: 'export',

    // 2. Disable Image Optimization (GitHub Pages cannot resize images on the fly)
    images: {
        unoptimized: true,
    },

    // 3. Set the Base Path (Conditionally)
    // Only use the base path in production for GitHub Pages. 
    // Locally, we want to run on localhost:3000/ without the suffix.
    basePath: process.env.NODE_ENV === 'production' ? '/for-forks-sake' : '',
};

export default nextConfig;