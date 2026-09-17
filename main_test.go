package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	ts := httptest.NewServer(NewServer(NewStore()))
	t.Cleanup(ts.Close)
	return ts
}

func TestAddAndListItems(t *testing.T) {
	ts := newTestServer(t)

	resp, err := http.Post(ts.URL+"/items", "application/json",
		strings.NewReader(`{"sku":"BOLT-M8","name":"M8 bolt","quantity":500}`))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("POST /items: got %d, want 201", resp.StatusCode)
	}

	resp, err = http.Get(ts.URL + "/items")
	if err != nil {
		t.Fatal(err)
	}
	var items []Item
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].SKU != "BOLT-M8" {
		t.Fatalf("GET /items: got %+v", items)
	}
}

func TestHealthz(t *testing.T) {
	ts := newTestServer(t)
	resp, err := http.Get(ts.URL + "/healthz")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /healthz: got %d, want 200", resp.StatusCode)
	}
	var body map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["status"] != "ok" {
		t.Fatalf("GET /healthz: got %+v", body)
	}
}

func TestGetUnknownItem(t *testing.T) {
	ts := newTestServer(t)
	resp, err := http.Get(ts.URL + "/items/42")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("GET /items/42: got %d, want 404", resp.StatusCode)
	}
}

func TestAddRejectsMissingFields(t *testing.T) {
	ts := newTestServer(t)
	resp, err := http.Post(ts.URL+"/items", "application/json", strings.NewReader(`{"quantity":1}`))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("POST /items: got %d, want 400", resp.StatusCode)
	}
}
