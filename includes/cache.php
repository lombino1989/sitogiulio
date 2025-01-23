<?php
class PageCache {
    private $cachePath = '../cache/';
    private $cacheTime = 3600; // 1 hour

    public function get($key) {
        $file = $this->cachePath . md5($key);
        if (file_exists($file) && (time() - filemtime($file)) < $this->cacheTime) {
            return file_get_contents($file);
        }
        return false;
    }

    public function set($key, $data) {
        $file = $this->cachePath . md5($key);
        return file_put_contents($file, $data);
    }
} 