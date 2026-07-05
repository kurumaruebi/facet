# Changelog

All notable changes to Facet are documented in this file.

## [0.1.0.0] - 2026-07-05

### Added

- Render all 14 Facet primitives through one deterministic, host-agnostic DOM renderer.
- Compose nested nodes, fixed annotations, summary/full zoom levels, and visible raw IR.
- Resolve Gate approvals as structured audit events with SHA-256 effect-summary hashes.
- Route LINK selections and locally bind Control parameters to deterministic re-renders.
- Validate the closed primitive vocabulary with a versioned JSON Schema.
- Explore schema-valid gstack, Linzumi, Crustdata, and Jinba demo surfaces.
- Verify renderer, interaction, schema, fallback, and security behavior with automated tests.

### Fixed

- Reject unsafe link and media URL protocols before navigation or fetch.
- Reject Gate resolutions outside `approve`, `deny`, and `modify`.
- Support keyboard activation for selectable Table rows.
