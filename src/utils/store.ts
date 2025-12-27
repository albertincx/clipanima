import {create} from "zustand";
import {combine, devtools} from "zustand/middleware";


export const NETWORK_IS_OFF = 2

// DEV
let demoOn = import.meta.env.VITE_DEMO === '1';

let demoStore = null;
if (demoOn) {
    console.log('demoOn');
}

export const useGameStore = create(
    devtools(combine(
        {
            ready: false,
            theme: 'dark',
            ...(demoStore ? demoStore : {}),
        } as any,
        (set, get, store): any => {
            let ws: any;

            // @ts-ignore
            let testCodeFunc;
            if (VITE_TEST) {
                import('./test-specific-code').then(({testCode}) => {
                    testCodeFunc = testCode;
                });
            }

            const recOn = (data?: any) => {
                console.log('recon');
                if (data && data.widgetUser && data.widgetUser.close) {
                    ws?.close();
                    return;
                }

                let newData: any = {
                    ready: false,
                    reconnect: 1,
                    network: -2,
                    tgLogin: false,
                };
                if (data && data.widgetUser && data.widgetUser.try) {
                    newData.data = {};
                    newData.network = NETWORK_IS_OFF;
                }

                set(newData);
            };

            const clearKey = (k: keyof any, val: any) => {
                let newStore: Partial<any> = {[k]: null};
                set(newStore);
            }
            const update = (k: any, v: any) => {
                if (k === 'langChange') {
                    set({langChange: (get().langChange || 1) + 1});
                    return;
                }

                set({[k]: v});
            }
            const toggle = (k: any, v: any) => {
                let v1 = v;
                // @ts-ignore
                if (get()?.[k] === v) v1 = '';
                set({[k]: v1});
            }
            return {
                reconnectOn: recOn,
                data: {},
                clearK: clearKey,
                update: update,
                toggle: toggle,
            } as any;
        }
    ), {
        enabled: import.meta.env.DEV,
    })
);
