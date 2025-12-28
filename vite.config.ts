import autoprefixer from 'autoprefixer'
import obfuscator from 'rollup-plugin-obfuscator';
import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore
import fs from 'node:fs/promises';
// @ts-ignore
import path from 'path';

let curTime = Date.now();

export default ({mode}) => {
    // @ts-ignore
    process.env = {...process.env, ...loadEnv(mode, process.cwd())};
    // @ts-ignore
    const url = process.env['VITE_APP_URL'] || '';
// @ts-ignore
    const VITE_BUILD_PATH = process.env['VITE_BUILD_PATH'] || 'dist';
// @ts-ignore
    const EXT_APP = process.env['VITE_EXT_APP'] || 'game-name';
// @ts-ignore
    const TEST_APP = process.env['VITE_TEST_APP'] || '';
    let isTest = url.match(/localhost/) || TEST_APP;
    // isTest = false;
    // @ts-ignore
    const isDev = mode === 'development';
    // @ts-ignore
    let isExtraAppName = process.env['VITE_APP_MODE'];
    if (isExtraAppName) isExtraAppName = `./${isExtraAppName}.html`;

    let extraModePlugin: any = false;
    // console.log(isExtraAppName)
    if (isDev || isExtraAppName) {
        // let file = isExtraAppName ? isExtraAppName : './dev.html';
        let file = isExtraAppName ? isExtraAppName : './index.html';
        extraModePlugin = {
            name: 'my-dev-plugin',
            transformIndexHtml: {
                order: 'pre',
                async handler() {
                    return await fs.readFile(file, 'utf8')
                }
            }
        }
    }

    let minify: any = false;

    let input = [
        'index.html',
    ];

    let rollupPlugin = [];
    let isCloseCode = !isTest;
    // isCloseCode = false;

    if (isCloseCode) {
        minify = 'terser';
        rollupPlugin = [
            // @ts-ignore
            obfuscator({
                // @ts-ignore
                transformObjectKeys: true,
                unicodeEscapeSequence: true,
                numbersToExpressions: true,
                shuffleStringArray: true,
                splitStrings: true,
                // debugProtection: true,
                // debugProtectionInterval: 4000,
                stringArrayThreshold: 1,
                identifierNamesGenerator: 'hexadecimal'
            })
        ];
    }

    // @ts-ignore
    return defineConfig({
        // @ts-ignore
        base: process.env.VITE_PUBLIC_BASE_URL || '/',
        define: {
            __BUILD__: curTime,
            EXT_APP: JSON.stringify(EXT_APP),
            VITE_BUILD_PATH: JSON.stringify(VITE_BUILD_PATH),
// @ts-ignore
            VITE_DEMO: `${process.env.VITE_DEMO || '0'}`,
            VITE_TEST: `${JSON.stringify(isTest ? '1' : '')}`,
        },
        plugins: [
            react({
                babel: {
                    presets: ['@babel/preset-typescript'],
                    plugins: [
                        '@babel/plugin-transform-typescript',
                    ],
                },
            }),
            {
                name: 'exclude-test-code',
                resolveId(source) {
                    if (
                        mode === 'production'
                        && !isTest
                        && source.includes('test-specific-code')
                    ) {
                        // Return a virtual module that does nothing
                        return {id: 'virtual-module', code: 'export const testCode = () => {};'};
                    }
                    return null;
                },
            },
            extraModePlugin,
            tailwindcss(),
            {
                name: 'inject-base-tag',
                transformIndexHtml: {
                    order: 'post',
                    handler: (html) => {
                        // @ts-ignore
                        const baseUrl = process.env.VITE_PUBLIC_BASE_URL || '/';
                        if (baseUrl !== '/') {
                            // Inject base tag after <head>
                            return html.replace(
                                /<head>/i,
                                `<head>\n    <base href="${baseUrl}" />`
                            );
                        }
                        return html;
                    },
                },
            },
        ].filter(Boolean),
        css: {
            postcss: {
                // @ts-ignore
                plugins: [autoprefixer],
            }
        },
        build: {
            outDir: VITE_BUILD_PATH,
            minify,
            assetsInlineLimit: 1,
            // minimum support es2015
            target: 'esnext',
            rollupOptions: {
                plugins: rollupPlugin,
                input,
                output: {
                    assetFileNames: function (file) {
                        return file.name.match('.svg')
                            ? `assets/svg/[name].[ext]`
                            : `assets/[name]-[hash].[ext]`;
                    },
                }
            },
            sourcemap: false,
        },
        resolve: {
            alias: {
                // @ts-ignore
                '@': path.resolve(__dirname, './src'),
            },
        },
        esbuild: mode === 'production' ? {
            drop: [
                'console',
                'debugger'
            ],
        } : {
            supported: {
                'top-level-await': true
            },
        },
        optimizeDeps: mode !== 'production' && {
            esbuildOptions: {
                supported: {
                    "top-level-await": true
                },
            },
        },
    })
}
