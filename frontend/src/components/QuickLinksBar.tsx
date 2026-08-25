import { useState } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconLink,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { api } from '../lib/api'
import type { QuickLink } from '../types'
import { quickLinkIconSrc } from '../lib/icons'

// Same card language as the stat strip / server cards below it (bordered
// box, sof-card hover lift) rather than a pill — kept as one flat box per
// link instead of a shared Paper, so it can be a plain <a> (a Mantine
// Paper polymorphed to "a" fights TS on href/target, see git history).
function QuickLinkBox({ link }: { link: QuickLink }) {
  const [iconFailed, setIconFailed] = useState(false)
  const iconSrc = quickLinkIconSrc(link.icon)
  const showImage = iconSrc && !iconFailed

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="sof-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)',
        textDecoration: 'none',
        color: 'var(--mantine-color-text)',
      }}
    >
      {showImage ? (
        <img
          src={iconSrc}
          alt=""
          width={22}
          height={22}
          style={{ objectFit: 'contain', flexShrink: 0 }}
          onError={() => setIconFailed(true)}
        />
      ) : (
        <IconLink size={18} style={{ flexShrink: 0 }} color="var(--mantine-color-dimmed)" />
      )}
      <Text size="sm" fw={600} span>
        {link.name}
      </Text>
    </a>
  )
}

// Editing works on an array of these (a client-only `key` for stable React
// identity while rows are added/reordered/deleted) — stripped back down to
// plain QuickLink shape before it's PUT to the backend.
type DraftLink = QuickLink & { key: string }

// Not crypto.randomUUID(): that API only exists in a "secure context"
// (HTTPS or localhost) — this dashboard is plain HTTP on a LAN IP, where
// calling it throws and (with no error boundary in this app) blanks the
// whole page. A key only needs to be unique within this modal's lifetime,
// so a counter is plenty.
let keySeq = 0
function nextKey(): string {
  keySeq += 1
  return `ql-${keySeq}`
}

function toDrafts(links: QuickLink[]): DraftLink[] {
  return links.map((l) => ({ ...l, key: nextKey() }))
}

function EditorModal({
  links,
  onClose,
  onSaved,
}: {
  links: QuickLink[]
  onClose: () => void
  onSaved: (links: QuickLink[]) => void
}) {
  const [drafts, setDrafts] = useState<DraftLink[]>(() => toDrafts(links))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(key: string, patch: Partial<DraftLink>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  }

  function remove(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key))
  }

  function move(index: number, dir: -1 | 1) {
    setDrafts((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function addRow() {
    setDrafts((prev) => [...prev, { key: nextKey(), name: '', url: '', icon: '' }])
  }

  async function handleSave() {
    setError(null)
    const cleaned = drafts
      .filter((d) => d.name.trim() && d.url.trim())
      .map((d, i) => ({ name: d.name.trim(), url: d.url.trim(), icon: d.icon?.trim() || undefined, order: i }))
    setSaving(true)
    try {
      const saved = await api.saveQuicklinks(cleaned)
      onSaved(saved)
      onClose()
    } catch {
      setError('Failed to save — check the backend logs.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal opened onClose={onClose} title="Quick links" size="lg" centered>
      <Stack gap="xs">
        {drafts.length === 0 && (
          <Text size="sm" c="dimmed">
            No links yet — add one below.
          </Text>
        )}
        {drafts.map((d, i) => (
          <Group key={d.key} gap={6} wrap="nowrap" align="flex-end">
            <TextInput
              label={i === 0 ? 'Icon' : undefined}
              placeholder="netbox or https://…"
              value={d.icon ?? ''}
              onChange={(e) => update(d.key, { icon: e.currentTarget.value })}
              style={{ width: 160 }}
            />
            <TextInput
              label={i === 0 ? 'Name' : undefined}
              placeholder="NetBox"
              value={d.name}
              onChange={(e) => update(d.key, { name: e.currentTarget.value })}
              style={{ flex: 1 }}
            />
            <TextInput
              label={i === 0 ? 'URL' : undefined}
              placeholder="https://…"
              value={d.url}
              onChange={(e) => update(d.key, { url: e.currentTarget.value })}
              style={{ flex: 2 }}
            />
            <ActionIcon variant="subtle" color="gray" disabled={i === 0} onClick={() => move(i, -1)}>
              <IconArrowUp size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              disabled={i === drafts.length - 1}
              onClick={() => move(i, 1)}
            >
              <IconArrowDown size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={() => remove(d.key)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))}

        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addRow} mt="xs">
          Add link
        </Button>

        <Text size="xs" c="dimmed">
          Icon is a{' '}
          <a href="https://github.com/homarr-labs/dashboard-icons" target="_blank" rel="noreferrer">
            dashboard-icons
          </a>{' '}
          slug (same as services), or paste a full image URL for a custom
          icon that isn't in that public set. Leave blank for a generic
          icon.
        </Text>

        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}

        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" color="gray" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

/** Row of external links (other projects, not NetBox inventory) — backed
 * by data/quicklinks.json on the server (see HelpPanel), editable either
 * by hand there or through this component's own editor modal (pencil
 * button), both reading/writing the same file via PUT /api/quicklinks.
 * Renders just the pencil button (no dead empty bar) when the list is
 * empty, so there's still an obvious way to add the first link. */
export default function QuickLinksBar({
  links,
  onChange,
}: {
  links: QuickLink[]
  onChange: (links: QuickLink[]) => void
}) {
  const [editing, setEditing] = useState(false)
  const sorted = [...links].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

  return (
    <>
      <Group gap="xs" wrap="wrap" mb="md" align="center">
        {sorted.map((link) => (
          <QuickLinkBox key={link.url} link={link} />
        ))}
        <Tooltip label="Edit quick links">
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={() => setEditing(true)}>
            <IconPencil size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {editing && (
        <EditorModal links={links} onClose={() => setEditing(false)} onSaved={onChange} />
      )}
    </>
  )
}
