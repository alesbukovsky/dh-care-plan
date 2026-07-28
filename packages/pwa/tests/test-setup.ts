import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest runs without globals, so auto-cleanup between tests has to be wired up here
afterEach(cleanup);
