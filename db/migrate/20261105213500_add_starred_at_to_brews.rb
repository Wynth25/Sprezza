class AddStarredAtToBrews < ActiveRecord::Migration[8.1]
  def change
    add_column :brews, :starred_at, :datetime unless column_exists?(:brews, :starred_at)
  end
end
