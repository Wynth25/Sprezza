class AddArchivedAndFreezeDateToBeans < ActiveRecord::Migration[8.1]
  def change
    add_column :beans, :archived, :boolean unless column_exists?(:beans, :archived)
    add_column :beans, :freeze_date, :date unless column_exists?(:beans, :freeze_date)
  end
end
