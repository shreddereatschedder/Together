"use client"
import { useEffect, useState } from "react"
import { supabase, isConfigured } from "../app/lib/supabase"
import { Plus, Gift, Trash2, ExternalLink, AlertCircle } from "lucide-react"

interface WishlistItem {
  name: string
  link: string
  id: string
}

export default function Wishlist({ isFocused }: { isFocused?: boolean }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [newItemName, setNewItemName] = useState("")
  const [newItemLink, setNewItemLink] = useState("")

  useEffect(() => {
    if (!supabase || !isConfigured) return

    const channel = supabase
      .channel("wishlist")
      .on("postgres_changes", { event: "*", schema: "public", table: "widgets", filter: "id=eq.wishlist" }, (payload: any) => {
        const items = (payload.new?.item || []).map((name: string, idx: number) => ({ name, link: payload.new?.link?.[idx] || "", id: `${idx}` }))
        setItems(items)
      })
      .subscribe()

    // Initial fetch
    supabase
      .from("widgets")
      .select("item,link")
      .eq("id", "wishlist")
      .single()
      .then(({ data }: any) => {
        const items = (data?.item || []).map((name: string, idx: number) => ({ name, link: data?.link?.[idx] || "", id: `${idx}` }))
        setItems(items)
      })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  const addItem = async () => {
    if (!newItemName.trim()) return
    const updatedItems = [...items, { name: newItemName, link: newItemLink, id: Date.now().toString() }]
    const itemNames = updatedItems.map((i) => i.name)
    const itemLinks = updatedItems.map((i) => i.link)
    
    // Update UI immediately
    setItems(updatedItems)
    setNewItemName("")
    setNewItemLink("")
    
    // Sync to Supabase
    if (supabase) {
      const { error } = await supabase.from("widgets").update({ item: itemNames, link: itemLinks }).eq("id", "wishlist")
      if (error) {
        console.error("Error adding wishlist item:", error)
        // Revert on error
        setItems(items)
      }
    }
  }

  const removeItem = async (itemId: string) => {
    const updatedItems = items.filter((i) => i.id !== itemId)
    const itemNames = updatedItems.map((i) => i.name)
    const itemLinks = updatedItems.map((i) => i.link)
    
    // Update UI immediately
    setItems(updatedItems)
    
    // Sync to Supabase
    if (supabase) {
      const { error } = await supabase.from("widgets").update({ item: itemNames, link: itemLinks }).eq("id", "wishlist")
      if (error) {
        console.error("Error removing wishlist item:", error)
        // Revert on error
        setItems(items)
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
      <div className="space-y-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addItem()}
          placeholder="Item name..."
          className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemLink}
            onChange={(e) => setNewItemLink(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addItem()}
            placeholder="Link (optional)..."
            className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <button
            onClick={addItem}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Items List */}
      {items.length > 0 ? (
        <div className={isFocused ? "space-y-2 flex-1 min-h-0 overflow-auto pr-2 scrollbar-thin" : "space-y-2 max-h-52 overflow-y-auto pr-2 scrollbar-thin"}>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 text-primary">
                <Gift className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{item.name}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 transition-colors truncate flex items-center gap-1 mt-0.5"
                  >
                    <span className="truncate">{item.link}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No wishlist items yet</p>
        </div>
      )}
    </div>
  )
}
