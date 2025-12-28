import React, {StrictMode, Suspense} from 'react'
import ReactDOM from 'react-dom/client'
import {ErrorBoundary} from "react-error-boundary";

import {ThemeProvider} from "./contexts/ThemeContext";
import './input.css';
import './utils/i18n';

import {lazy} from "./utils/lazy";
// @ts-ignore
import hasOwn from 'object.hasown';

const LoaderFbPage = () => <div></div>
const FallbackRender = () => {
}

if (!Object.hasOwn) hasOwn.shim();

const Projects = lazy(() => import('./App'));

const MainApp = () => (
    <Suspense fallback={<LoaderFbPage/>}>
        {/*// @ts-ignore*/}
        <ErrorBoundary fallbackRender={FallbackRender}>
            <Projects/>
        </ErrorBoundary>
    </Suspense>
)

// @ts-ignore
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <ThemeProvider>
        {import.meta.env.DEV ? (
            <Suspense fallback={<LoaderFbPage/>}>
                {/*// @ts-ignore*/}
                <ErrorBoundary fallbackRender={FallbackRender}>
                    <Projects/>
                </ErrorBoundary>
            </Suspense>
        ) : (
            <StrictMode>
                <MainApp/>
            </StrictMode>
        )}
    </ThemeProvider>
)
