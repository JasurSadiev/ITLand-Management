"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Palette, Smile, Sparkles, MessageSquareQuote } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomization } from "@/lib/context"

const THEMES = [
  { id: "indigo", color: "bg-indigo-600", label: "Indigo" },
  { id: "rose", color: "bg-rose-600", label: "Rose" },
  { id: "emerald", color: "bg-emerald-600", label: "Emerald" },
  { id: "amber", color: "bg-amber-600", label: "Amber" },
  { id: "violet", color: "bg-violet-600", label: "Violet" },
]

const EMOJIS = ["👨‍💻", "👩‍💻", "🚀", "🌟", "💡", "🎯", "🎓", "🤖", "🎨", "🌈"]

interface Preferences {
  theme?: string
  avatarEmoji?: string
  greetingStyle?: string
  confettiEnabled?: boolean
  showMotivation?: boolean
}

interface PersonalizationCardProps {
  preferences: Preferences
  onChange: (updates: Partial<Preferences>) => void
}

export function PersonalizationCard({ preferences: propPrefs, onChange: propOnChange }: PersonalizationCardProps) {
  const { preferences: contextPrefs, updatePreferences, baseMode, setBaseMode } = useCustomization()
  
  const preferences = propPrefs || contextPrefs
  const onChange = propOnChange || updatePreferences
  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Personalization</CardTitle>
        </div>
        <CardDescription>
          Customize your dashboard experience and theme.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Theme Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            Accent Theme
          </Label>
          <div className="flex flex-wrap gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => onChange({ theme: theme.id as any })}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-110",
                  theme.color,
                  preferences.theme === theme.id ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-80"
                )}
                title={theme.label}
              >
                {preferences.theme === theme.id && <Sparkles className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Atmosphere Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            Atmosphere Mode
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'light', label: 'Light', color: 'bg-white border-zinc-200' },
              { id: 'dark', label: 'Dark', color: 'bg-zinc-900 border-zinc-800' },
              { id: 'midnight', label: 'Midnight', color: 'bg-black border-zinc-900' },
              { id: 'sepia', label: 'Sepia', color: 'bg-[#f4ecd8] border-[#e4dcc8]' },
              { id: 'nord', label: 'Nord', color: 'bg-[#2e3440] border-[#3b4252]' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setBaseMode(mode.id as any)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all hover:bg-muted",
                  baseMode === mode.id ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className={cn("h-6 w-6 rounded border shadow-sm", mode.color)} />
                <span className="text-[10px] font-medium">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emoji Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Smile className="h-4 w-4" />
            Avatar Emoji
          </Label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange({ avatarEmoji: emoji })}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-lg border bg-background text-xl transition-all hover:bg-muted",
                  preferences.avatarEmoji === emoji ? "border-primary bg-primary/10 scale-110" : "border-border"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Greeting Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4" />
            Greeting Style
          </Label>
          <Select
            value={preferences.greetingStyle}
            onValueChange={(val) => onChange({ greetingStyle: val as any })}
          >
            <SelectTrigger className="w-full sm:max-w-xs">
              <SelectValue placeholder="Select a style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Classic (Hello!)</SelectItem>
              <SelectItem value="motivator">Motivator (Keep pushing!)</SelectItem>
              <SelectItem value="space">Space Explorer (Ready for takeoff?)</SelectItem>
              <SelectItem value="cyber">Cyberpunk (System Ready)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-border my-2" />

        {/* Fun Toggles */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Confetti</Label>
              <p className="text-xs text-muted-foreground">Celebrate completion</p>
            </div>
            <Switch
              checked={preferences.confettiEnabled}
              onCheckedChange={(checked) => onChange({ confettiEnabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Quotes
              </Label>
              <p className="text-xs text-muted-foreground">Daily inspiration</p>
            </div>
            <Switch
              checked={preferences.showMotivation}
              onCheckedChange={(checked) => onChange({ showMotivation: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
