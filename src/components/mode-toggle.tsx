import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const update = () => {
      if (theme === "dark") {
        setIsDark(true)
      } else if (theme === "light") {
        setIsDark(false)
      } else {
        // "system"
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
      }
    }

    update()

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [theme])

  const toggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <button
      onClick={toggle}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label="Alternar tema"
      className={[
        "relative flex items-center gap-1.5 h-8 px-2 rounded-xl border transition-all duration-300",
        isDark
          ? "bg-[#10B981]/10 border-[#10B981]/30 hover:bg-[#10B981]/20"
          : "bg-gray-100 border-gray-200 hover:bg-gray-200",
      ].join(" ")}
    >
      {/* Sun icon */}
      <Sun
        size={13}
        className={[
          "transition-all duration-300",
          isDark ? "text-gray-500 opacity-50" : "text-yellow-500",
        ].join(" ")}
      />

      {/* Slide track */}
      <div className={[
        "relative w-9 h-5 rounded-full transition-all duration-300",
        isDark ? "bg-[#10B981]" : "bg-gray-300",
      ].join(" ")}>
        {/* Knob */}
        <div className={[
          "absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-300",
          isDark
            ? "translate-x-[18px] bg-black"
            : "translate-x-0.5 bg-white",
        ].join(" ")} />
      </div>

      {/* Moon icon */}
      <Moon
        size={13}
        className={[
          "transition-all duration-300",
          isDark ? "text-[#10B981]" : "text-gray-400 opacity-50",
        ].join(" ")}
      />
    </button>
  )
}
