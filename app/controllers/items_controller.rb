class ItemsController < ApplicationController
  def index
    @items = Item.all
    @item = Item.new
  end

  def new
    @item = Item.new
  end

  def create
    @item = Item.new(item_params)

    if @item.save
      redirect_to '/'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @item = Item.find(params[:id])
    @item.update(item_params)

    render json: { message: "Success" }
  end

  def destroy
    @item = Item.find(params[:id])
    @item.destroy
    redirect_to '/'
  end

  private
  def item_params
    params.require(:item).permit(:name, :purchased, :tag_list)
  end
end
