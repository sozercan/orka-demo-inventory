// Command inventory is a small HTTP service that tracks warehouse stock.
//
// It is intentionally minimal: an in-memory store, a JSON API, and a test
// suite. It exists so that coding agents have something real, but small, to
// change.
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"sync"
)

// Item is one stock line in the warehouse.
type Item struct {
	ID       int    `json:"id"`
	SKU      string `json:"sku"`
	Name     string `json:"name"`
	Quantity int    `json:"quantity"`
}

// Store is an in-memory inventory.
type Store struct {
	mu     sync.RWMutex
	nextID int
	items  map[int]Item
}

// NewStore returns an empty Store.
func NewStore() *Store {
	return &Store{nextID: 1, items: map[int]Item{}}
}

// Add stores a new item and returns it with its assigned ID.
func (s *Store) Add(item Item) Item {
	s.mu.Lock()
	defer s.mu.Unlock()
	item.ID = s.nextID
	s.nextID++
	s.items[item.ID] = item
	return item
}

// List returns every item sorted by ID.
func (s *Store) List() []Item {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Item, 0, len(s.items))
	for _, item := range s.items {
		out = append(out, item)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// Get returns the item with the given ID.
func (s *Store) Get(id int) (Item, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	item, ok := s.items[id]
	return item, ok
}

// Server exposes the Store over HTTP.
type Server struct {
	store *Store
	mux   *http.ServeMux
}

// NewServer wires the routes.
func NewServer(store *Store) *Server {
	s := &Server{store: store, mux: http.NewServeMux()}
	s.mux.HandleFunc("GET /items", s.listItems)
	s.mux.HandleFunc("POST /items", s.addItem)
	s.mux.HandleFunc("GET /items/{id}", s.getItem)
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}

func (s *Server) listItems(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.store.List())
}

func (s *Server) addItem(w http.ResponseWriter, r *http.Request) {
    var item Item
    if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
        return
    }
    if item.SKU == "" || item.Name == "" {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sku and name are required"})
        return
    }
    if item.Quantity < 0 {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "quantity must be non-negative"})
        return
    }
    writeJSON(w, http.StatusCreated, s.store.Add(item))
}
