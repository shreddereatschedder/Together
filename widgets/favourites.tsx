"use client"
import { useEffect, useState } from "react"
import { supabase, isConfigured } from "../app/lib/supabase"
import { Plus, Star, Trash2, AlertCircle } from "lucide-react"

export default function Favourites({ isFocused }: { isFocused?: boolean }) {
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState("")

  useEffect(() => {
    if (!supabase || !isConfigured) return

    const channel = supabase
      .channel("favourites")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "widgets", filter: "id=eq.favourites" },
        (payload: any) => {
          if (payload.new?.items) setItems(payload.new.items)
        }
      )
      .subscribe()

    // Initial fetch
    supabase
      .from("widgets")
      .select("items")
      .eq("id", "favourites")
      .single()
      .then(({ data }: any) => {
        if (data?.items) setItems(data.items)
      })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  const addItem = async () => {
    if (!newItem.trim()) return
    const prev = items
    const updated = [...prev, newItem]
    // Optimistic UI
    setItems(updated)
    setNewItem("")

    if (supabase) {
      const { data, error } = await supabase.from("widgets").select("items").eq("id", "favourites").single()
      const currentItems = data?.items || []
      const { error: upsertError } = await supabase.from("widgets").update({ items: [...currentItems, newItem] }).eq("id", "favourites")
      if (upsertError) {
        console.error("Error adding favourite item:", upsertError)
        setItems(prev)
      }
    }
  }

  const removeItem = async (item: string) => {
    const prev = items
    const updated = prev.filter((i) => i !== item)
    // Optimistic UI
    setItems(updated)

    if (supabase) {
      const { data } = await supabase.from("widgets").select("items").eq("id", "favourites").single()
      const currentItems = data?.items || []
      const newList = currentItems.filter((i: string) => i !== item)
      const { error } = await supabase.from("widgets").update({ items: newList }).eq("id", "favourites")
      if (error) {
        console.error("Error removing favourite item:", error)
        setItems(prev)
      }
    }
  }

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 mb-1">Supabase Not Configured</p>
            <p className="text-xs text-yellow-700">
              Please add your Supabase environment variables in the Vars section of the sidebar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isFocused ? "space-y-4 h-full flex flex-col" : "space-y-4"}>
      {/* Add Item Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addItem()}
          placeholder="Add a favourite thing..."
          className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        <button
          onClick={addItem}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Items List */}
      {items.length > 0 ? (
        <div className={isFocused ? "space-y-2 flex-1 min-h-0 overflow-auto pr-2 scrollbar-thin" : "space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin"}>
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-muted/50 to-transparent rounded-xl hover:from-muted transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
              </div>
              <span className="flex-1 text-sm text-foreground">{item}</span>
              <button
                onClick={() => removeItem(item)}
                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No favourites added yet</p>
        </div>
      )}
    </div>
  )
}
