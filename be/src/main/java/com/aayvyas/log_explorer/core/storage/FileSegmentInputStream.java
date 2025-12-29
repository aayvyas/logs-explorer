package com.aayvyas.log_explorer.core.storage;

import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;

public class FileSegmentInputStream extends InputStream {
    private final RandomAccessFile raf;
    private long remaining;

    public FileSegmentInputStream(RandomAccessFile raf, long startOffset) throws IOException {
        this.raf = raf;
        this.raf.seek(startOffset);
    }

    @Override
    public int read() throws IOException {
        // This is slow (byte by byte), but Jackson buffers internally so it's okay for
        // now.
        return raf.read();
    }

    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        return raf.read(b, off, len);
    }
}