import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { PotholeRecord, insertPothole } from '../db/database';

export interface PotholeEntry extends PotholeRecord {
    id: number;
}

interface State {
    potholes: PotholeEntry[];
    sessionId: string;
    sessionActive: boolean;
    sessionStart: number | null;
}

type Action =
    | { type: 'START_SESSION'; sessionId: string }
    | { type: 'STOP_SESSION' }
    | { type: 'ADD_POTHOLE'; pothole: PotholeEntry }
    | { type: 'LOAD_POTHOLES'; potholes: PotholeEntry[] }
    | { type: 'CLEAR_POTHOLES' };

function generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'START_SESSION':
            return {
                ...state,
                sessionId: action.sessionId,
                sessionActive: true,
                sessionStart: Date.now(),
                potholes: [],
            };
        case 'STOP_SESSION':
            return { ...state, sessionActive: false };
        case 'ADD_POTHOLE':
            return { ...state, potholes: [action.pothole, ...state.potholes] };
        case 'LOAD_POTHOLES':
            return { ...state, potholes: action.potholes };
        case 'CLEAR_POTHOLES':
            return { ...state, potholes: [] };
        default:
            return state;
    }
}

const initialState: State = {
    potholes: [],
    sessionId: generateSessionId(),
    sessionActive: false,
    sessionStart: null,
};

interface PotholeContextType extends State {
    startSession: () => void;
    stopSession: () => void;
    addPothole: (record: Omit<PotholeRecord, 'id' | 'session_id'>) => Promise<void>;
    loadPotholes: (potholes: PotholeEntry[]) => void;
    clearPotholes: () => void;
}

const PotholeContext = createContext<PotholeContextType | null>(null);

export function PotholeProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const startSession = useCallback(() => {
        dispatch({ type: 'START_SESSION', sessionId: generateSessionId() });
    }, []);

    const stopSession = useCallback(() => {
        dispatch({ type: 'STOP_SESSION' });
    }, []);

    const addPothole = useCallback(
        async (record: Omit<PotholeRecord, 'id' | 'session_id'>) => {
            const fullRecord = { ...record, session_id: state.sessionId };
            const insertedId = await insertPothole(fullRecord);
            dispatch({
                type: 'ADD_POTHOLE',
                pothole: { ...fullRecord, id: insertedId },
            });
        },
        [state.sessionId]
    );

    const loadPotholes = useCallback((potholes: PotholeEntry[]) => {
        dispatch({ type: 'LOAD_POTHOLES', potholes });
    }, []);

    const clearPotholes = useCallback(() => {
        dispatch({ type: 'CLEAR_POTHOLES' });
    }, []);

    return (
        <PotholeContext.Provider
            value={{ ...state, startSession, stopSession, addPothole, loadPotholes, clearPotholes }}
        >
            {children}
        </PotholeContext.Provider>
    );
}

export function usePotholes(): PotholeContextType {
    const ctx = useContext(PotholeContext);
    if (!ctx) throw new Error('usePotholes must be used within PotholeProvider');
    return ctx;
}
