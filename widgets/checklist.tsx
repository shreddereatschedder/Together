"use client"
import { useEffect, useState } from "react"
import { supabase, isConfigured } from "../app/lib/supabase"
import { Plus, Check, Trash2, ListTodo, AlertCircle } from "lucide-react"



interface ChecklistItem {
  text: string
  completed: boolean
  id: string
}

export default function Checklist({ isFocused }: { isFocused?: boolean }) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [newItem, setNewItem] = useState("")

  useEffect(() => {
    if (!supabase || !isConfigured) {
      return
    }

    const channel = supabase
      .channel("checklist")
      .on("postgres_changes", { event: "*", schema: "public", table: "widgets", filter: "id=eq.checklist" }, (payload: any) => {
        if (payload.new?.tasks) setItems(payload.new.tasks)
      })
      .subscribe()

    // Initial fetch
    supabase
      .from("widgets")
      .select("tasks")
      .eq("id", "checklist")
      .single()
      .then(({ data }: any) => {
        if (data?.tasks) setItems(data.tasks)
      })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  const addItem = async () => {
    if (!newItem.trim()) return
    const item: ChecklistItem = {
      text: newItem,
      completed: false,
      id: Date.now().toString(),
    }
    const updatedItems = [...items, item]
    
    // Update UI immediately
    setItems(updatedItems)
    setNewItem("")
    
    // Sync to Supabase
    if (supabase) {
      const { error } = await supabase.from("widgets").update({ tasks: updatedItems }).eq("id", "checklist")
      if (error) {
        console.error("Error adding checklist item:", error)
        // Revert on error
        setItems(items)
      }
    }
  }

  const toggleItem = async (item: ChecklistItem) => {
    const updatedItems = items.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i))
    
    // Update UI immediately
    setItems(updatedItems)
    
    // Sync to Supabase
    if (supabase) {
      const { error } = await supabase.from("widgets").update({ tasks: updatedItems }).eq("id", "checklist")
      if (error) {
        console.error("Error toggling checklist item:", error)
        // Revert on error
        setItems(items)
      }
    }
  }

  const removeItem = async (itemId: string) => {
    const updatedItems = items.filter((i) => i.id !== itemId)
    
    // Update UI immediately
    setItems(updatedItems)
    
    // Sync to Supabase
    if (supabase) {
      const { error } = await supabase.from("widgets").update({ tasks: updatedItems }).eq("id", "checklist")
      if (error) {
        console.error("Error removing checklist item:", error)
        // Revert on error
        setItems(items)
      }
    }
  }

  const completedCount = items.filter((i) => i.completed).length

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
      {/* Progress */}
      {items.length > 0 && (
        <div className="p-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm font-bold text-primary">
              {completedCount}/{items.length}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Item Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addItem()}
          placeholder="Add a to-do item..."
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
        <div className={isFocused ? "space-y-2 flex-1 min-h-0 overflow-auto pr-2 scrollbar-thin" : "space-y-2 max-h-44 overflow-y-auto pr-2 scrollbar-thin"}>
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-all group ${
                item.completed ? "opacity-60" : "opacity-100"
              }`}
            >
              <button
                onClick={() => toggleItem(item)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  item.completed ? "bg-primary border-primary" : "border-border hover:border-primary"
                }`}
              >
                {item.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <span
                className={`flex-1 text-sm transition-all ${
                  item.completed ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.text}
              </span>
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
          <ListTodo className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No items yet</p>
        </div>
      )}
    </div>
  )
}
