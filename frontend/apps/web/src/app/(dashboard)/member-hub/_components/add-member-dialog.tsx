"use client"

import * as React from "react"
import { IconLoader2, IconUserPlus, IconEye, IconEyeOff } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, type RegionItem, type RoleItem } from "@/services/api-client"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  regions: RegionItem[]
  roles: RoleItem[]
}

const EMPTY_FORM = { userName: "", password: "", roleId: "" }

export function AddMemberDialog({ open, onOpenChange, regions, roles }: Readonly<AddMemberDialogProps>) {
  const { tokens } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const [form, setForm] = React.useState(EMPTY_FORM)
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [showPassword, setShowPassword] = React.useState(false)

  const resetForm = React.useCallback(() => {
    setForm(EMPTY_FORM)
    setSelectedIds(new Set())
    setShowPassword(false)
  }, [])

  function toggleRegion(regId: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(regId)
      else next.delete(regId)
      return next
    })
  }

  const { mutate: createMember, isPending } = useMutation({
    mutationFn: async () => {
      const role = roles.find((r) => String(r.id) === form.roleId)
      const newUser = await apiClient.createUser(tokens!.access_token, {
        user_name: form.userName.trim(),
        password: form.password,
        access_type: role?.name === "admin" ? "all" : "",
        login_type: "",
        regions: Array.from(selectedIds),
      })
      if (role) {
        await apiClient.setUserRole(tokens!.access_token, newUser.id, role.id)
      }
      return newUser
    },
    onSuccess: () => {
      toast.success(t.memberHub.memberCreated)
      queryClient.invalidateQueries({ queryKey: ["members"] })
      resetForm()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create member")
    },
  })

  const isValid = form.userName.trim().length >= 3 && form.password.length >= 8

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUserPlus className="h-5 w-5 text-[#009640]" />
            {t.memberHub.addMember}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-member-username">{t.memberHub.columns.username}</Label>
            <Input
              id="add-member-username"
              name="add-member-username"
              autoComplete="off"
              value={form.userName}
              onChange={(e) => setForm((prev) => ({ ...prev, userName: e.target.value }))}
              placeholder={t.memberHub.usernamePlaceholder}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-member-password">{t.memberHub.password}</Label>
            <div className="relative">
              <Input
                id="add-member-password"
                name="add-member-password"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={t.memberHub.passwordPlaceholder}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#009640]"
              >
                {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t.memberHub.columns.role}</Label>
            <Select
              value={form.roleId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, roleId: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)} className="capitalize">
                    {role.name.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>{t.memberHub.manageRegions}</Label>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-md border py-1">
              {regions.length === 0 && (
                <span className="text-sm text-muted-foreground px-2 py-2">{t.memberHub.noRegionsAvailable}</span>
              )}
              {regions.map((region) => {
                const label = region.reg_name_kh ? `${region.reg_name} | ${region.reg_name_kh}` : region.reg_name
                return (
                  <Label
                    key={region.reg_id}
                    className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-muted/40 transition-colors cursor-pointer font-normal"
                  >
                    <Checkbox
                      checked={selectedIds.has(region.reg_id)}
                      onCheckedChange={(value) => toggleRegion(region.reg_id, !!value)}
                    />
                    <span className="text-sm">{label}</span>
                  </Label>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => createMember()}
            disabled={isPending || !isValid}
            className="bg-[#009640] hover:bg-[#007a33] text-white"
          >
            {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.memberHub.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
