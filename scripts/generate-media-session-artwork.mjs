#!/usr/bin/env node

/**
 * AI-generated utility script.
 *
 * Generates square Media Session thumbnail derivatives for every `.jpg` in
 * `public/images/sites` and writes them to `public/images/sites/thumbnails`.
 *
 * Output files:
 * - `<image>-256.jpg`
 * - `<image>-512.jpg`
 * - `<image>-1024.jpg`
 *
 * Usage:
 * - `node scripts/generate-media-session-artwork.mjs`
 * - `bun run generate:artwork`
 *
 * Requirements:
 * - macOS `sips` must be available on PATH
 *
 * Behavior:
 * - reads each source image's dimensions
 * - center-crops to the largest possible square
 * - resizes that square to the configured thumbnail sizes
 */

import { mkdtempSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL("..", import.meta.url));
const SOURCE_DIR = fileURLToPath(new URL("../public/images/sites/", import.meta.url));
const OUTPUT_DIR = fileURLToPath(
    new URL("../public/images/sites/thumbnails/", import.meta.url),
);
const THUMBNAIL_SIZES = [256, 512, 1024];

const getImageDimensions = (imagePath) => {
    const output = execFileSync(
        "sips",
        ["-g", "pixelWidth", "-g", "pixelHeight", imagePath],
        {
            cwd: ROOT_DIR,
            encoding: "utf8",
        },
    );

    const widthMatch = output.match(/pixelWidth:\s+(\d+)/);
    const heightMatch = output.match(/pixelHeight:\s+(\d+)/);

    if (!widthMatch || !heightMatch) {
        throw new Error(`Could not read image dimensions for ${imagePath}`);
    }

    return {
        width: Number(widthMatch[1]),
        height: Number(heightMatch[1]),
    };
};

const runSips = (args) => {
    execFileSync("sips", args, {
        cwd: ROOT_DIR,
        stdio: "pipe",
    });
};

const generateThumbnails = (imagePath) => {
    const { width, height } = getImageDimensions(imagePath);
    const cropSize = Math.min(width, height);
    const imageBaseName = basename(imagePath, ".jpg");
    const tempDir = mkdtempSync(join(tmpdir(), "yvml-thumbnails-"));
    const croppedPath = join(tempDir, `${imageBaseName}-cropped.jpg`);

    try {
        runSips(["-c", String(cropSize), String(cropSize), imagePath, "--out", croppedPath]);

        for (const size of THUMBNAIL_SIZES) {
            runSips([
                "-z",
                String(size),
                String(size),
                croppedPath,
                "--out",
                join(OUTPUT_DIR, `${imageBaseName}-${size}.jpg`),
            ]);
        }
    } finally {
        rmSync(tempDir, { recursive: true, force: true });
    }
};

mkdirSync(OUTPUT_DIR, { recursive: true });

const sourceImages = readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jpg"))
    .map((entry) => join(SOURCE_DIR, entry.name))
    .sort();

for (const imagePath of sourceImages) {
    console.log(`Generating thumbnails for ${basename(imagePath)}`);
    generateThumbnails(imagePath);
}

console.log(
    `Generated ${sourceImages.length * THUMBNAIL_SIZES.length} thumbnail files in ${OUTPUT_DIR}`,
);
