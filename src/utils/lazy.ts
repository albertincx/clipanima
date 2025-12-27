import {lazy as originalLazy} from 'react';

export const lazy = (importComponent: any) => originalLazy(async () => {
    const stringifiedFunction = importComponent.toString();
    const val = sessionStorage.getItem('reloaded-components');
    // @ts-ignore
    const componentsRefreshed: string[] = JSON.parse(val) || [];
    let refreshedComponents: Set<string>;

    if (Array.isArray(componentsRefreshed)) {
        refreshedComponents = new Set(componentsRefreshed);
    } else {
        throw Error('Unexpected value from data store');
    }

    const hasComponentRefreshed = refreshedComponents.has(stringifiedFunction);

    try {
        const component = await importComponent();
        refreshedComponents.delete(stringifiedFunction);
        sessionStorage.setItem(
            'reloaded-components',
            JSON.stringify(Array.from(refreshedComponents))
        );
        return component;
    } catch (error) {
        if (!hasComponentRefreshed) {
            refreshedComponents.add(stringifiedFunction);
            sessionStorage.setItem(
                'reloaded-components',
                JSON.stringify(Array.from(refreshedComponents))
            );
            location.reload();
        } else {
            throw error;
        }
    }
}) as any;

