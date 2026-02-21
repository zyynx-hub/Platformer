@tool

# Tileset Post-Import: adds collision ONLY to IntGrid tiles (wall data),
# not to visual/decorative tiles from the Cavernas tileset.
# IntGrid sources are named "<LayerName>_Tiles" by the LDtk importer.

func post_import(tilesets: Dictionary) -> Dictionary:
	for key in tilesets.keys():
		var tileset: TileSet = tilesets[key]
		print("[tileset_post_import] TileSet grid=", key, " sources=", tileset.get_source_count())

		# Add a physics layer if none exists
		if tileset.get_physics_layers_count() == 0:
			tileset.add_physics_layer()

		var tile_size: Vector2i = tileset.tile_size
		var half := Vector2(tile_size) / 2.0

		var polygon := PackedVector2Array([
			Vector2(-half.x, -half.y),
			Vector2( half.x, -half.y),
			Vector2( half.x,  half.y),
			Vector2(-half.x,  half.y),
		])

		for source_idx in range(tileset.get_source_count()):
			var source_id := tileset.get_source_id(source_idx)
			var source := tileset.get_source(source_id)
			if not source is TileSetAtlasSource:
				continue
			var atlas: TileSetAtlasSource = source
			print("[tileset_post_import]   source id=", source_id, " name='", atlas.resource_name, "' tiles=", atlas.get_tiles_count())

			# Only add collision to IntGrid sources (named "*_Tiles")
			if not atlas.resource_name.ends_with("_Tiles"):
				print("[tileset_post_import]   SKIP (not IntGrid)")
				continue

			print("[tileset_post_import]   ADDING collision to ", atlas.get_tiles_count(), " tiles")
			for tile_idx in range(atlas.get_tiles_count()):
				var coords := atlas.get_tile_id(tile_idx)
				var tile_data: TileData = atlas.get_tile_data(coords, 0)
				if tile_data == null:
					continue
				if tile_data.get_collision_polygons_count(0) == 0:
					tile_data.add_collision_polygon(0)
					tile_data.set_collision_polygon_points(0, 0, polygon)

	return tilesets
