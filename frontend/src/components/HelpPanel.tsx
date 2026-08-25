import { useState } from 'react'
import { Anchor, Code, Collapse, List, Text, ThemeIcon, UnstyledButton } from '@mantine/core'
import { IconChevronRight, IconHelpCircle } from '@tabler/icons-react'

/** Quick "how do I get a thing to show up here" reference for NetBox data
 * entry — collapsed by default so it doesn't compete with the dashboard
 * itself, but always in the same place at the bottom of every view. Every
 * field/tag name here is read straight from backend/app/{config,dataset,
 * icons}.py, not guessed, so keep it in sync if those change. */
export default function HelpPanel({ displayTag }: { displayTag: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: 32 }}>
      <UnstyledButton
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <ThemeIcon size={22} radius="xl" variant="light" color="gray">
          <IconHelpCircle size={14} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          How do I get something to show up here? (NetBox cheatsheet)
        </Text>
        <IconChevronRight
          size={14}
          color="var(--mantine-color-dimmed)"
          style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform 150ms ease' }}
        />
      </UnstyledButton>

      <Collapse expanded={open}>
        <List size="sm" spacing="xs" mt="sm" mb="md" c="dimmed">
          <List.Item>
            <b>Show a device or VM:</b> add the NetBox tag{' '}
            <Code>{displayTag}</Code> to it. Nothing else here reads any
            other tag as a visibility switch.
          </List.Item>
          <List.Item>
            <b>Show a service on it:</b> create an IPAM <b>Service</b> in
            NetBox, set its <i>Assigned Device/VM</i> to that host, and fill
            in Ports/Protocol. Set the custom field <Code>internal_url</Code>{' '}
            and/or <Code>external_url</Code> — at least one is needed for
            the health check and the LAN/world open buttons to appear.
          </List.Item>
          <List.Item>
            <b>Service icon:</b> guessed from the Service's own <i>Name</i>{' '}
            (e.g. "Jellyfin", "qBittorrent") against{' '}
            <Anchor href="https://github.com/homarr-labs/dashboard-icons" target="_blank" rel="noreferrer">
              dashboard-icons
            </Anchor>
            . No exact match falls back to a generic icon — harmless, just
            less pretty.
          </List.Item>
          <List.Item>
            <b>Server icon:</b> guessed from the device/VM's <i>Platform</i>{' '}
            field (e.g. "Debian 13", "Proxmox VE 9.2", "Synology DSM") by
            keyword match.
          </List.Item>
          <List.Item>
            <b>Host → VM grouping (topology view):</b> set the VM's{' '}
            <i>Cluster</i>, and set that <i>same</i> Cluster on the physical
            host Device — that's the only link NetBox has between a VM and
            the box it actually runs on.
          </List.Item>
          <List.Item>
            <b>Backup panel:</b> custom fields <Code>backup_method</Code>,{' '}
            <Code>backup_target_device</Code> / <Code>backup_target_vm</Code>,{' '}
            and <Code>backup_path</Code> on the device/VM. Leave all blank to
            get the "no backup configured" state instead of an empty panel.
          </List.Item>
          <List.Item>
            <b>Quick links row</b> (top of the page, external projects that
            aren't NetBox inventory): use its pencil-icon editor, or
            hand-edit <Code>data/quicklinks.json</Code> on the server — a
            plain JSON array of{' '}
            <Code>{'{ "name", "url", "icon", "order" }'}</Code>.{' '}
            <Code>icon</Code> is a dashboard-icons slug (same as services)
            or a full image URL for a custom icon.
          </List.Item>
        </List>
      </Collapse>
    </div>
  )
}
