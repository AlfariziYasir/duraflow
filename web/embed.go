package web

import (
	"embed"
	"io/fs"
	"net/http"
)

// DistFS embeds the production build output of the DuraFlow frontend console.
//
//go:embed dist/*
var DistFS embed.FS

// Handler returns an http.Handler that serves the embedded single-page application.
// If a requested file does not exist, it falls back to index.html (SPA routing).
func Handler() (http.Handler, error) {
	sub, err := fs.Sub(DistFS, "dist")
	if err != nil {
		return nil, err
	}
	return http.FileServer(http.FS(sub)), nil
}
