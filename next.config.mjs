/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Force a static export (creates an /out folder)
    output: 'export',

    // 2. Disable Image Optimization (GitHub Pages cannot resize images on the fly)
    images: {
        unoptimized: true,
    },

    // 3. Set the Base Path (IMPORTANT)
    // Since your repo is "for-forks-sake", your URL will be "username.github.io/for-forks-sake"
    // If you don't add this, your CSS and images will be broken.
    basePath: '/for-forks-sake',
};

export default nextConfig;