class RecipesController < ApplicationController
  before_action :set_recipe, only: %i[ show edit update destroy quick_log ]
  before_action :require_admin!, only: %i[ create update destroy quick_log sort ]

  def index
    @beans = Bean.includes(recipes: [:basket, :brews])
                 .where(archived: [nil, false])
                 .order(position: :asc, created_at: :desc)
  end

  def show
  end

  def new
    @recipe = Recipe.new(bean_id: params[:bean_id])
  end

  def edit
  end

  def create
    @recipe = Recipe.new(recipe_params)

    if @recipe.save
      if params[:initial_dose].present? && params[:initial_grind].present?
        @recipe.brews.create!(
          dose: params[:initial_dose],
          grind: params[:initial_grind]
        )
      end
      redirect_to root_path, notice: "Recipe created and dialed in!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @recipe.update(recipe_params)
      redirect_to recipe_url(@recipe), notice: "Recipe was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @recipe.destroy
    redirect_to root_path, notice: "Recipe deleted."
  end

  def quick_log
    new_dose = params[:dose].to_f.round(1)
    new_grind = params[:grind].to_f.round(1)

    @recipe.brews.create!(dose: new_dose, grind: new_grind)
    redirect_to root_path, notice: "Brewed!"
  end

  def sort
    if params[:recipe_ids].present?
      params[:recipe_ids].each_with_index do |id, index|
        Recipe.where(id: id).update_all(position: index + 1)
      end
    end
    head :ok
  end

  private

  def set_recipe
    @recipe = Recipe.find(params[:id])
  end

  def recipe_params
    params.require(:recipe).permit(:bean_id, :basket_id, :style, :archived, :position)
  end
end
